export interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  url: string;
  platform: string;
  rating?: number;
  reviewCount?: number;
  description?: string;
  isPromotional?: boolean;
  isFreeDelivery?: boolean;
  isBestPrice?: boolean;
  brand?: string;
  specs?: {
    key: string;
    value: string;
  }[];
}

export interface PlatformInfo {
  name: string;
  displayName: string;
  logo: string;
  color: string;
}

export interface SearchParams {
  query: string;
  category?: string;
  priceRange?: string;
  sort?: string;
  page?: number;
  platforms?: string[];
}

export interface SearchResults {
  products: Product[];
  totalCount: number;
}

export interface FavoriteProduct {
  userId: number;
  productId: string;
  platform: string;
  dateAdded: Date;
}

export interface PriceAlert {
  id: number;
  userId: number;
  productId: string;
  platform: string;
  targetPrice: number;
  isActive: boolean;
  dateCreated: Date;
}

export interface User {
  id: number;
  username: string;
  email: string;
}
