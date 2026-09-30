// POC — email receipt import: WRITE step (branch: poc/email-import).
//
// Takes the items an admin APPROVED on public/email-import-poc.html and:
//   1. Uses the matched catalog product, or creates brand → product_line → product
//      for items not in the catalog (idempotent upserts on the unique keys).
//   2. Adds each product to the signed-in user's cabinet (user_products), skipping
//      anything already there.
// Denied items never reach this endpoint.
//
// Safety: requires the POC secret AND a signed-in Supabase user whose profiles.role
// is 'admin'. Uses the service key server-side only. Imported catalog rows are
// identifiable by sku prefix 'import-'.
//
// Env (Vercel → Preview only): SUPABASE_SERVICE_KEY, EMAIL_IMPORT_POC_SECRET

const SUPABASE_URL = "https://zailubkqzouvjauodmrk.supabase.co";
const CATEGORIES = new Set(["skincare", "makeup", "haircare", "bodycare", "fragrance", "tools", "supplements", "other"]);
const MAX_ITEMS = 100;

const svcHeaders = (extra = {}) => ({
  apikey: process.env.SUPABASE_SERVICE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
  "content-type": "application/json",
  ...extra,
});

async function rest(path, { method = "GET", body, prefer } = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: svcHeaders(prefer ? { Prefer: prefer } : {}),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${method} ${path.split("?")[0]} → ${r.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

const slugify = (s) => (s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

async function currentUser(jwt) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: process.env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${jwt}` },
  });
  if (!r.ok) return null;
  return r.json();
}

// ── Catalog find-or-insert (never overwrites existing catalog rows) ─────────
async function findOrInsert(table, filter, row, conflictCols) {
  const found = await rest(`${table}?${filter}&select=id&limit=1`);
  if (found.length) return { id: found[0].id, created: false };
  await rest(`${table}?on_conflict=${conflictCols}`, { method: "POST", body: [row], prefer: "resolution=ignore-duplicates,return=minimal" });
  const again = await rest(`${table}?${filter}&select=id&limit=1`);
  if (!again.length) throw new Error(`${table} insert did not land`);
  return { id: again[0].id, created: true };
}
async function ensureBrand(name) {
  const slug = slugify(name);
  return (await findOrInsert("brands", `slug=eq.${encodeURIComponent(slug)}`, { name, slug }, "slug")).id;
}
async function ensureProductLine(brandId, name, category) {
  const slug = slugify(name);
  return (await findOrInsert("product_lines", `brand_id=eq.${brandId}&slug=eq.${encodeURIComponent(slug)}`,
    { brand_id: brandId, name, slug, category }, "brand_id,slug")).id;
}
async function ensureProduct(lineId, item) {
  const sku = ("import-" + slugify(`${item.brand} ${item.product} ${item.variant || ""} ${item.size || ""}`)).slice(0, 120);
  const row = { product_line_id: lineId, sku, name: item.variant || item.size || item.product };
  if (typeof item.price_usd === "number" && item.price_usd > 0) row.price_usd = item.price_usd;
  return findOrInsert("products", `sku=eq.${encodeURIComponent(sku)}`, row, "sku");
}

async function commitItem(userId, item) {
  let productId = item.catalogProductId || null;
  let createdProduct = false;

  if (!productId) {
    const brandName = (item.brand || "").trim(), productName = (item.product || "").trim();
    if (!brandName || !productName) throw new Error("missing brand or product name");
    const category = CATEGORIES.has(item.category) ? item.category : "other";
    const brandId = item.brandId || await ensureBrand(brandName);
    const lineId = await ensureProductLine(brandId, productName, category);
    const p = await ensureProduct(lineId, item);
    productId = p.id;
    createdProduct = p.created;
  }

  const already = await rest(`user_products?user_id=eq.${userId}&product_id=eq.${productId}&deleted_at=is.null&select=id`);
  if (already.length) return { action: "already_in_cabinet", productId, createdProduct };

  const status = item.orders > 1 ? "repurchased" : "using";
  await rest("user_products", { method: "POST", body: [{ user_id: userId, product_id: productId, status }], prefer: "return=minimal" });
  return { action: "added", productId, createdProduct, status };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const secret = process.env.EMAIL_IMPORT_POC_SECRET;
  if (!secret || req.headers["x-poc-secret"] !== secret) return res.status(401).json({ error: "Unauthorized" });

  const jwt = (req.headers.authorization || "").replace(/^Bearer /, "");
  const user = jwt && await currentUser(jwt);
  if (!user?.id) return res.status(401).json({ error: "Sign in first" });

  try {
    const profile = await rest(`profiles?id=eq.${user.id}&select=role`);
    if (profile[0]?.role !== "admin") return res.status(403).json({ error: "Admin only during the POC" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  const items = Array.isArray(req.body?.items) ? req.body.items.slice(0, MAX_ITEMS) : [];
  if (!items.length) return res.status(400).json({ error: "No approved items" });

  // Sequential on purpose: two items from the same new brand must not race on the brand insert.
  const results = [];
  for (const item of items) {
    try {
      results.push({ key: item.key, ...(await commitItem(user.id, item)) });
    } catch (err) {
      results.push({ key: item.key, action: "error", error: err.message });
    }
  }
  return res.status(200).json({ userId: user.id, results });
}
