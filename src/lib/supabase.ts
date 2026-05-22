import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Single shared client — import this everywhere instead of creating new instances
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
