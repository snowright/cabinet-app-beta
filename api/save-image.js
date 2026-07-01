const SUPABASE_URL = "https://zailubkqzouvjauodmrk.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  // CORS for the admin page
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Secret gate
  const secret = req.query.secret || req.body?.secret;
  if (secret !== "cabinet") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // GET: return all products with their current image status
  if (req.method === "GET") {
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/products?select=id,name,image_url,product_lines(name,category,brands(name))&order=id&limit=1000`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      const products = data.map((p) => ({
        id: p.id,
        name: p.name,
        image_url: p.image_url,
        brand: p.product_lines?.brands?.name || "",
        line: p.product_lines?.name || "",
        category: p.product_lines?.category || "other",
      }));
      return res.status(200).json({ products });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST: save an image URL to a product
  if (req.method === "POST") {
    const { productId, imageUrl } = req.body || {};
    if (!productId || !imageUrl) {
      return res.status(400).json({ error: "Missing productId or imageUrl" });
    }
    try {
      const r = await fetch(
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
      if (!r.ok) throw new Error(await r.text());
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
