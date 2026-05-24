import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Safety check
if (!supabaseUrl) {
  throw new Error("Missing env: VITE_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("Missing env: VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Optional: Helper to check if env variables are loaded
export const checkSupabaseEnv = () => {
  console.log("🔍 Supabase Config Check:");
  console.log("VITE_SUPABASE_URL:", supabaseUrl ? "✅ Loaded" : "❌ Missing");
  console.log("VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? "✅ Loaded" : "❌ Missing");
};