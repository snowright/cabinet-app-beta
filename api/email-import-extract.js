// POC — email receipt import (branch: poc/email-import). NOT for production.
//
// Receives stripped order-email text from the browser, asks Claude Haiku to pull
// out beauty line items, and fuzzy-matches them against the cabinet. catalog.
// Stores NOTHING: no email text, no tokens, no results.
//
// Env (Vercel → Preview only):
//   ANTHROPIC_API_KEY         — Claude API key
//   SUPABASE_SERVICE_KEY      — already set; used here READ-ONLY for the catalog
//   EMAIL_IMPORT_POC_SECRET   — any string; the POC page must send it (stops strangers burning API credits)

const SUPABASE_URL = "https://zailubkqzouvjauodmrk.supabase.co";
// Accept the lowercase name too (Vercel variable names are case-sensitive).
const anthropicKey = () => (process.env.ANTHROPIC_API_KEY || process.env.anthropic_api_key || "").trim();
const MODEL = "claude-haiku-4-5-20251001";
const MAX_EMAILS_PER_CALL = 8;
const MAX_CHARS_PER_EMAIL = 12000;

const SYSTEM_PROMPT = `You extract purchased products from retailer order emails for a beauty app.
Return ONLY a JSON object, no prose, in exactly this shape:
{"is_order": true|false, "retailer": string|null, "order_id": string|null, "order_date": "YYYY-MM-DD"|null,
 "items": [{"brand": string, "product": string, "variant": string|null, "size": string|null, "quantity": number, "price_usd": number|null, "category": "skincare"|"makeup"|"haircare"|"bodycare"|"fragrance"|"tools"|"other"}]}
Rules:
- Only include beauty / personal-care items actually purchased. Skip samples, free gifts, gift cards, shipping, taxes, loyalty points, and marketing recommendations ("you may also like").
- "variant" = shade, scent or flavor if shown. "size" = e.g. "50 mL", "1.7 oz", "mini".
- Brand and product exactly as written in the email, without the variant/size.
- If the email is not an order/purchase confirmation or shipping notice (e.g. a promo), return {"is_order": false, "items": []}.`;

// ── Catalog (cached per warm function instance) ─────────────────────────────
let catalogCache = null, catalogLoadedAt = 0;
async function loadCatalog() {
  if (catalogCache && Date.now() - catalogLoadedAt < 60_000) return catalogCache;
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/products?select=id,name,product_lines(id,name,category,brands(id,name))&limit=5000`,
    { headers: { apikey: process.env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}` } }
  );
  if (!r.ok) throw new Error("catalog load failed: " + (await r.text()));
  const rows = await r.json();
  catalogLoadedAt = Date.now();
  catalogCache = rows.map((p) => {
    const brand = p.product_lines?.brands?.name || "";
    const line = p.product_lines?.name || "";
    return {
      id: p.id,
      brand,
      brandId: p.product_lines?.brands?.id || null,
      line,
      variant: p.name,
      brandKey: norm(brand),
      lineTokens: tokens(line),
      allTokens: tokens(`${line} ${p.name}`),
    };
  });
  return catalogCache;
}

// ── Matching ────────────────────────────────────────────────────────────────
const STOP = new Set(["the", "a", "an", "and", "with", "for", "of", "in", "by", "ml", "oz", "fl", "mini", "travel", "size", "full"]);
function norm(s) {
  return (s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
function tokens(s) {
  return new Set(norm(s).split(" ").filter((t) => t && !STOP.has(t) && !/^\d+$/.test(t)));
}
function overlap(a, b) {
  if (!a.size || !b.size) return 0;
  let hit = 0;
  for (const t of a) if (b.has(t)) hit++;
  return hit / Math.min(a.size, b.size); // share of the shorter name covered
}
function brandMatches(itemBrandKey, catBrandKey) {
  if (!itemBrandKey || !catBrandKey) return false;
  if (itemBrandKey === catBrandKey) return true;
  const a = itemBrandKey.replace(/ /g, ""), b = catBrandKey.replace(/ /g, "");
  return a.includes(b) || b.includes(a);
}
function matchItem(item, catalog) {
  const bKey = norm(item.brand);
  const itemTokens = tokens(`${item.product} ${item.variant || ""}`);
  const sameBrand = catalog.filter((c) => brandMatches(bKey, c.brandKey));
  let best = null, bestScore = 0;
  for (const c of sameBrand) {
    const s = Math.max(overlap(tokens(item.product), c.lineTokens), overlap(itemTokens, c.allTokens) * 0.95);
    if (s > bestScore) { bestScore = s; best = c; }
  }
  const status = !sameBrand.length ? "brand_not_in_catalog"
    : bestScore >= 0.6 ? "matched"
    : bestScore >= 0.35 ? "possible"
    : "product_not_in_catalog";
  return {
    status,
    score: Math.round(bestScore * 100) / 100,
    // The brand we'd file a new product under, when the brand is already in the catalog
    brand: sameBrand.length ? { id: sameBrand[0].brandId, name: sameBrand[0].brand } : null,
    catalog: best && status !== "product_not_in_catalog" ? { id: best.id, brand: best.brand, line: best.line, variant: best.variant } : null,
  };
}

// ── Claude extraction ───────────────────────────────────────────────────────
async function extract(email) {
  const text = String(email.text || "").slice(0, MAX_CHARS_PER_EMAIL);
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey(),
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `From: ${email.from || ""}\nSubject: ${email.subject || ""}\nDate: ${email.date || ""}\n\n${text}`,
      }],
    }),
  });
  if (!r.ok) throw new Error(`Claude ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const data = await r.json();
  const raw = (data.content || []).map((b) => b.text || "").join("");
  const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  const parsed = JSON.parse(json);
  return {
    parsed,
    usage: data.usage || {},
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const secret = process.env.EMAIL_IMPORT_POC_SECRET;
  if (!secret) return res.status(500).json({ error: "Missing EMAIL_IMPORT_POC_SECRET in Vercel for Preview. Add it and redeploy." });
  if (req.headers["x-poc-secret"] !== secret) return res.status(401).json({ error: "Wrong POC secret" });
  if (!anthropicKey()) {
    // Diagnostics: names only, never values.
    const seen = Object.keys(process.env).filter((k) => /anthropic|claude/i.test(k));
    return res.status(500).json({ error: `Missing ANTHROPIC_API_KEY in Vercel for Preview. Server sees: ${seen.length ? seen.join(", ") : "no Anthropic-named variables"} (env: ${process.env.VERCEL_ENV || "?"}, branch: ${process.env.VERCEL_GIT_COMMIT_REF || "?"}).` });
  }
  if (!process.env.SUPABASE_SERVICE_KEY) return res.status(500).json({ error: "Missing SUPABASE_SERVICE_KEY in Vercel for Preview. Tick Preview on it and redeploy." });

  const emails = Array.isArray(req.body?.emails) ? req.body.emails.slice(0, MAX_EMAILS_PER_CALL) : [];
  if (!emails.length) return res.status(400).json({ error: "No emails" });

  try {
    const catalog = await loadCatalog();
    const results = await Promise.all(emails.map(async (email) => {
      try {
        const { parsed, usage } = await extract(email);
        const items = (parsed.items || []).map((it) => ({ ...it, match: matchItem(it, catalog) }));
        return {
          messageId: email.id,
          is_order: !!parsed.is_order,
          retailer: parsed.retailer || null,
          order_id: parsed.order_id || null,
          order_date: parsed.order_date || null,
          items,
          usage,
        };
      } catch (err) {
        return { messageId: email.id, error: err.message };
      }
    }));
    return res.status(200).json({ results, catalogSize: catalog.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
export { matchItem, tokens, norm };
