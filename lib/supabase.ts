import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** DB row shape (snake_case) */
export interface SourcingItemRow {
  id: string;
  image_url: string;
  material: string;
  price: number;
  source_url: string;
  status: string;
  created_at: string;
}
