// POC helper: hands the email-import page the PUBLIC Supabase URL + anon key
// (the same values already shipped in the app bundle), so the page can sign in.
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://zailubkqzouvjauodmrk.supabase.co";
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!anonKey) return res.status(500).json({ error: "Missing VITE_SUPABASE_ANON_KEY in Vercel for Preview. Add it (same value as Production) and redeploy." });
  return res.status(200).json({ supabaseUrl, anonKey });
}
