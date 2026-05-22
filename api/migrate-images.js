const SUPABASE_URL = "https://zailubkqzouvjauodmrk.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchProducts(offset = 0, limit = 10) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?select=id,name,image_url,product_lines(name,brands(name))&image_url=not.is.null&limit=${limit}&offset=${offset}`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  if (!res.ok) throw new Error(`Supabase fetch failed: ${await res.text()}`);
  const data = await res.json();
  // Only process products that still have Sephora URLs (not yet migrated to Cloudinary)
  return data.filter(p => p.image_url && p.image_url.includes('sephora.com'));
}

async function uploadToCloudinary(imageUrl, publicId) {
  // Use Cloudinary's fetch/upload API to pull from Sephora and re-host
  const formData = new URLSearchParams();
  formData.append('file', imageUrl);
  formData.append('public_id', publicId);
  formData.append('folder', 'cabinet-products');
  formData.append('overwrite', 'false');

  // Generate auth signature
  const timestamp = Math.round(Date.now() / 1000);
  const str = `folder=cabinet-products&overwrite=false&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
  
  // Use crypto for signature
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const body = new URLSearchParams({
    file: imageUrl,
    public_id: publicId,
    folder: 'cabinet-products',
    overwrite: 'false',
    timestamp: timestamp.toString(),
    api_key: API_KEY,
    signature,
  });

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body,
    }
  );

  const json = await res.json();
  if (!res.ok) throw new Error(`Cloudinary upload failed: ${json.error?.message}`);
  return json.secure_url;
}

async function updateImageUrl(productId, imageUrl) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?id=eq.${productId}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ image_url: imageUrl }),
    }
  );
  if (!res.ok) throw new Error(`Supabase update failed: ${await res.text()}`);
}

export default async function handler(req, res) {
  if (req.query.secret !== 'cabinet') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const offset = parseInt(req.query.offset || '0', 10);
  const limit = 10;

  try {
    const products = await fetchProducts(offset, limit);

    if (products.length === 0) {
      return res.status(200).json({
        message: '✅ All done! No more Sephora images to migrate.',
        offset,
        processed: 0,
      });
    }

    const results = { success: [], failed: [] };

    for (const p of products) {
      const brandName = p.product_lines?.brands?.name || 'unknown';
      const publicId = `${brandName}-${p.id}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');

      try {
        const cloudinaryUrl = await uploadToCloudinary(p.image_url, publicId);
        await updateImageUrl(p.id, cloudinaryUrl);
        results.success.push({ name: p.name, url: cloudinaryUrl });
      } catch (err) {
        results.failed.push({ name: p.name, reason: err.message });
      }

      await sleep(300);
    }

    const nextOffset = offset + limit;

    return res.status(200).json({
      offset,
      processed: products.length,
      success: results.success.length,
      failed: results.failed.length,
      failedProducts: results.failed,
      next: products.length === limit
        ? `https://cabinetappbeta.vercel.app/api/migrate-images?secret=cabinet&offset=${nextOffset}`
        : null,
      message: products.length === limit
        ? `✓ Batch done. Visit the 'next' URL to continue.`
        : `✓ All Sephora images migrated to Cloudinary!`,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
