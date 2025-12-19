export interface ProductData {
  title: string;
  description: string;
  features: string[];
  priceEstimate?: string;
  category?: string;
  marketing?: {
    instagramCaption: string;
    hashtags: string[];
    salesEmail: string;
    seoKeywords: string[];
  };
}

export interface InventoryItem {
  id: string;
  timestamp: number;
  productData: ProductData;
  imageData: string; // Base64
  mimeType: string;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  EDITING = 'EDITING',
  READY = 'READY',
  ERROR = 'ERROR'
}

export interface ImageFile {
  data: string; // base64
  mimeType: string;
}