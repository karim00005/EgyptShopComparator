// Define types that match the shared schema
// This prevents circular dependencies while maintaining type safety

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  currency: string;
  imageUrl: string;
  url: string;
  platform: string;
  brand: string | null;
  category: string | null;
  availability: boolean;
  rating: number | null;
  reviewCount: number | null;
  specifications: Record<string, string> | null;
  dateAdded: Date | string;
  dateUpdated: Date | string;
}

export interface SearchParams {
  query: string;
  platforms?: string[];
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  category?: string;
  brand?: string;
}

export interface FavoriteProduct {
  id?: number;
  userId: number;
  productId: string;
  platform: string;
  dateAdded: Date | string;
}

export interface PriceAlert {
  id?: number;
  userId: number;
  productId: string;
  platform: string;
  targetPrice: number;
  currentPrice: number;
  active: boolean;
  dateCreated: Date | string;
  dateTriggered: Date | string | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PlatformInfo {
  name: string;
  displayName: string;
  logo: string;
  color: string;
}

export interface SearchResults {
  products: Product[];
  totalCount: number;
}
