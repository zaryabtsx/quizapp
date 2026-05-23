// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

// @ts-expect-error - Vite env variables are injected at build time
const supabaseUrl = (import.meta.env as any).VITE_SUPABASE_URL as string;
// @ts-expect-error - Vite env variables are injected at build time
const supabaseAnonKey = (import.meta.env as any).VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);