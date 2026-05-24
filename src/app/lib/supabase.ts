// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

// Get Supabase URL - works with Vite env or window global (Vercel)
const supabaseUrl = 
  (import.meta.env as any).VITE_SUPABASE_URL ||
  (window as any).__ENV__?.VITE_SUPABASE_URL ||
  import.meta.env.PUBLIC_SUPABASE_URL ||
  "";

// Get Supabase Anon Key - works with Vite env or window global (Vercel)
const supabaseAnonKey = 
  (import.meta.env as any).VITE_SUPABASE_ANON_KEY ||
  (window as any).__ENV__?.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
  "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
  console.error("URL:", supabaseUrl ? "✓ Set" : "✗ Missing");
  console.error("Key:", supabaseAnonKey ? "✓ Set" : "✗ Missing");
  throw new Error("Missing Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);