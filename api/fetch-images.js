const SUPABASE_URL = "https://zailubkqzouvjauodmrk.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchAllProducts() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?select=id,name,image_url,product_lines(name,brands(name))&image_url=is.null&limit=1000`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  if (!res.ok) throw new Error(`Supabase fetch failed: ${await res.text()}`);
  return res.json();
}

async function searchImage(query) {
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", GOOGLE_API_KEY);
  url.searchParams.set("cx", GOOGLE_CSE_ID);
  url.searchParams.set("q", query);
  url.searchParams.set("searchType", "image");
  url.searchParams.set("num", "5");
  url.searchParams.set("imgType", "photo");
  url.searchParams.set("imgSize", "medium");
  url.searchParams.set("imgColorType", "color");

  const res = await fetch(url.toString());
  const json = await res.json();

  if (!res.ok) throw new Error(`Google API error: ${json.error?.message}`);

  const items = json.items || [];
  if (items.length === 0) return null;

  // Prefer square-ish product shots
  const best = items.find((item) => {
    const w = item.image?.width || 0;
    const h = item.image?.height || 0;
    const ratio = w / h;
    return ratio > 0.7 && ratio < 1.5;
  });

  return (best || items[0])?.link || null;
}

async function updateImageUrl(productId, imageUrl) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?id=eq.${productId}`,
    {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ image_url: imageUrl }),
    }
  );
  if (!res.ok) throw new Error(`Supabase update failed: ${await res.text()}`);
}

export default async function handler(req, res) {
  // Simple auth check — only run if ?secret=cabinet matches
  if (req.query.secret !== "cabinet") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const products = await fetchAllProducts();
    console.log(`Found ${products.length} products with no image_url`);

    const results = { success: [], failed: [] };

    for (const p of products) {
      const brandName = p.product_lines?.brands?.name || "";
      const lineName = p.product_lines?.name || "";
      const query = `${brandName} ${lineName} product`.trim();

      try {
        const imageUrl = await searchImage(query);
        if (imageUrl) {
          await updateImageUrl(p.id, imageUrl);
          results.success.push({ query, imageUrl });
          console.log(`✓ ${query}`);
        } else {
          results.failed.push({ query, reason: "no image found" });
          console.log(`✗ ${query}`);
        }
      } catch (err) {
        results.failed.push({ query, reason: err.message });
        console.log(`✗ ${query}: ${err.message}`);
      }

      // 300ms between requests — stay under Google rate limits
      await sleep(300);
    }

    return res.status(200).json({
      total: products.length,
      success: results.success.length,
      failed: results.failed.length,
      failedProducts: results.failed,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
