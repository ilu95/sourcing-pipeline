import { createClient } from "@supabase/supabase-js";
import { MaterialEntry } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** DB row shape (snake_case) */
export interface SourcingItemRow {
  id: string;
  image_url: string;
  material: string;
  material_detail: MaterialEntry[] | null;
  price: number;
  price_cny: number | null;
  source_url: string;
  sourcing_reason: string | null;
  category: string;
  expected_sell_price: number | null;
  is_sample_available: boolean;
  moq: number;
  status: string;
  created_at: string;
}
