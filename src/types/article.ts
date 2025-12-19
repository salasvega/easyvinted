export type ArticleStatus = 'draft' | 'ready' | 'scheduled' | 'published' | 'sold';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'all-seasons' | 'undefined';

export type Condition = 'new_with_tags' | 'new_without_tags' | 'very_good' | 'good' | 'satisfactory';

export interface Article {
  id: string;
  title: string;
  description: string;
  brand: string;
  size: string;
  condition: Condition;
  main_category: string;
  subcategory: string;
  item_category: string;
  price: number;
  season: Season;
  suggested_period?: string;
  photos: string[];
  status: ArticleStatus;
  color?: string;
  material?: string;
  reference_number?: string;
  scheduled_for?: string;
  published_at?: string;
  vinted_url?: string;
  sold_at?: string;
  sold_price?: number;
  sale_price?: number;
  net_profit?: number;
  fees?: number;
  shipping_cost?: number;
  buyer_name?: string;
  sale_notes?: string;

  // 🌱 Nouveaux champs pour le simulateur de frais de port
  estimated_weight?: number | null;
  shipping_estimate?: number | null;
  shipping_carrier_preferred?: string | null;
  shipping_band_label?: string | null;
  suggested_price_min?: number | null;
  suggested_price_max?: number | null;

  seller_id?: string;
  created_at: string;
  updated_at: string;

  seo_keywords?: string[];
  hashtags?: string[];
  search_terms?: string[];
  ai_confidence_score?: number;
}

export interface VintedSettings {
  email: string;
  password: string;
  max_posts_per_day: number;
  min_delay_minutes: number;
}
