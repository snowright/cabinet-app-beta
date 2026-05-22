const SUPABASE_URL = "https://zailubkqzouvjauodmrk.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchNextBatch() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?select=id,name,image_url,product_lines(name,brands(name))&image_url=like.*sephora*&limit=10`,
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

async function countRemaining() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?select=id&image_url=like.*sephora*`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: 'count=exact',
        'Range-Unit': 'items',
        Range: '0-0',
      },
    }
  );
  const range = res.headers.get('content-range');
  if (range) {
    const match = range.match(/\/(\d+)$/);
    return match ? parseInt(match[1]) : null;
  }
  return null;
}

async function uploadToCloudinary(imageUrl, publicId) {
  const timestamp = Math.round(Date.now() / 1000);
  const str = `folder=cabinet-products&overwrite=false&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;

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
    { method: 'POST', body }
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

  try {
    const products = await fetchNextBatch();
    const remaining = await countRemaining();

    if (products.length === 0) {
      return res.status(200).json({
        message: '✅ All done! All images migrated to Cloudinary.',
        remaining: 0,
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
        // If upload failed, update with a placeholder so it doesn't block the queue
        // but only for "Resource not found" errors (bad Sephora SKU)
        if (err.message.includes('Resource not found')) {
          await updateImageUrl(p.id, 'NEEDS_MANUAL_IMAGE');
        }
        results.failed.push({ name: p.name, reason: err.message });
      }

      await sleep(300);
    }

    const remainingAfter = (remaining || 0) - results.success.length;

    return res.status(200).json({
      processed: products.length,
      success: results.success.length,
      failed: results.failed.length,
      remainingAfter: Math.max(0, remainingAfter),
      failedProducts: results.failed,
      next: remainingAfter > 0
        ? `https://cabinetappbeta.vercel.app/api/migrate-images?secret=cabinet`
        : null,
      message: remainingAfter > 0
        ? `✓ Batch done. ~${Math.max(0, remainingAfter)} remaining. Click 'next' to continue.`
        : `✅ All done!`,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
