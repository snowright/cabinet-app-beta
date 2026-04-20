import { createClient } from "@supabase/supabase-js";

// These are filled in automatically from Vercel's environment variables.
// You never need to touch this file.
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error(
    "Missing Supabase environment variables.\n" +
    "In Vercel: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your project settings."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: true,
  },
});
