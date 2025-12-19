import { Season } from './article';

export type LotStatus = 'draft' | 'ready' | 'scheduled' | 'published' | 'sold';

export interface Lot {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category_id?: number;
  season?: Season;
  price: number;
  original_total_price: number;
  discount_percentage: number;
  cover_photo?: string;
  photos: string[];
  status: LotStatus;
  scheduled_for?: string;
  published_at?: string;
  vinted_url?: string;
  reference_number?: string;
  seller_id?: string | null;
  created_at: string;
  updated_at: string;
  sold_at?: string;
  sold_price?: number;
  net_profit?: number;
  fees?: number;
  shipping_cost?: number;
  buyer_name?: string;
  sale_notes?: string;
  article_count?: number;
  seo_keywords?: string[];
  hashtags?: string[];
  search_terms?: string[];
  ai_confidence_score?: number;
}

export interface LotItem {
  id: string;
  lot_id: string;
  article_id: string;
  created_at: string;
}

export interface LotWithArticles extends Lot {
  articles: Array<{
    id: string;
    title: string;
    brand?: string;
    price: number;
    photos: string[];
    size?: string;
    category_id?: number;
  }>;
}

export interface LotBuilderStep {
  step: 1 | 2 | 3 | 4;
  data: {
    name?: string;
    description?: string;
    category_id?: number;
    season?: Season;
    selectedArticles?: string[];
    price?: number;
    cover_photo?: string;
    photos?: string[];
  };
}
