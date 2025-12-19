export interface Article {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: string;
  category: string;
  main_category?: string | null;
  subcategory?: string | null;
  item_category?: string | null;
  brand: string | null;
  size: string | null;
  condition: string;
  photos: string[] | null;
  color: string | null;
  material: string | null;
  status: 'draft' | 'ready' | 'scheduled' | 'published' | 'sold';
  vinted_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicationJob {
  id: string;
  article_id: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  run_at: string;
  vinted_url: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface VintedCredentials {
  email: string;
  password: string;
}

export interface PublicationResult {
  success: boolean;
  vintedUrl?: string;
  error?: string;
}
