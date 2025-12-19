export interface VintedArticle {
  title: string;
  description: string;
  brand: string;
  size: string;
  condition: string;
  categoryId: string;
  price: number;
  color?: string;
  material?: string;
  photos: string[];
}

export interface VintedPublishResult {
  success: boolean;
  articleId: string;
  vintedUrl?: string;
  error?: string;
}

export interface VintedSession {
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  }>;
  localStorage?: Record<string, string>;
}

export interface ArticleToPublish {
  id: string;
  title: string;
  description: string;
  brand: string;
  size: string;
  condition: string;
  main_category: string;
  subcategory: string;
  item_category: string;
  price: number;
  photos: string[];
  color?: string;
  material?: string;
  scheduled_for?: string;
}
