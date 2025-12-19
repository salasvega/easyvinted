import { createClient } from '@supabase/supabase-js';
import { Article } from '../types/article';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Product extends Article {
  purchase_price?: number;
  image_url?: string;
}

export type { Article };
