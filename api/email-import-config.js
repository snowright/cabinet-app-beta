// POC helper: hands the email-import page the PUBLIC Supabase URL + anon key
// (the same values already shipped in the app bundle), so the page can sign in.
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return res.status(500).json({ error: "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set for this environment" });
  return res.status(200).json({ supabaseUrl, anonKey });
}
