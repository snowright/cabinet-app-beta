import { createClient } from "@supabase/supabase-js";

// Environment variables are injected at build time via .env.production
// Both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in that file.
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: true,
  },
});
