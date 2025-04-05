import { useState } from "react";
import { Product } from "@/utils/types";
import { useFavorites } from "@/context/FavoritesContext";

interface ProductCardProps {
  product: Product;
  onCompareClick: (product: Product) => void;
}

export function ProductCard({ product, onCompareClick }: ProductCardProps) {
  const { favorites, addFavorite, removeFavorite } = useFavorites();
  const isFavorite = favorites.some(
    fav => fav.productId === product.id && fav.platform === product.platform
  );
  
  // Format price with currency
  const formatPrice = (price?: number) => {
    if (!price) return '';
    return `${price.toFixed(2)} EGP`;
  };
  
  // Calculate discount percentage
  const calculateDiscount = () => {
    if (product.originalPrice && product.price) {
      const discount = ((product.originalPrice - product.price) / product.originalPrice) * 100;
      return `${Math.round(discount)}% OFF`;
    }
    return product.discount ? `${product.discount}% OFF` : '';
  };
  
  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isFavorite) {
      removeFavorite(product.id, product.platform);
    } else {
      addFavorite({
        userId: 1, // In a real app, this would be the logged-in user's ID
        productId: product.id,
        platform: product.platform,
        dateAdded: new Date()
      });
    }
  };
  
  // Get platform logo
  const getPlatformLogo = (platform: string) => {
    switch (platform) {
      case 'amazon':
        return 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/320px-Amazon_logo.svg.png';
      case 'noon':
        return 'https://e7.pngegg.com/pngimages/178/595/png-clipart-noon-hd-logo-thumbnail.png';
      case 'carrefour':
        return 'https://play-lh.googleusercontent.com/Zz_8v5v8tKY4ZyNHwh0gU_P5JrQ018GYmpyui0r3-rC4S8qtd4LtWN0K9Z6KMUb4KA';
      case 'talabat':
        return 'https://play-lh.googleusercontent.com/KhGz6kt8AOi0vQSbH3cCH9jHQVw7oebQ9S9MUuKiLANhkdW6wfiHcl3uGVT4uoJR37wu';
      default:
        return '';
    }
  };
  
  // Get platform display name
  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'amazon':
        return 'Amazon';
      case 'noon':
        return 'Noon';
      case 'carrefour':
        return 'Carrefour';
      case 'talabat':
        return 'Talabat';
      default:
        return platform;
    }
  };
  
  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onCompareClick(product);
  };
  
  const handleOutboundClick = (e: React.MouseEvent) => {
    // Track outbound click in a real app
    console.log(`Outbound click to ${product.platform}: ${product.url}`);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
      <div className="relative">
        <img 
          src={product.image} 
          alt={product.title} 
          className="w-full h-48 object-contain"
          onError={(e) => {
            // Fallback image on error
            e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Image+Not+Available';
          }}
        />
        <div className="absolute top-2 left-2 flex space-x-1">
          {product.isBestPrice && (
            <span className="bg-green-500 text-white px-2 py-0.5 rounded-md text-xs font-medium">Best Price</span>
          )}
          {product.isPromotional && (
            <span className="bg-amber-500 text-white px-2 py-0.5 rounded-md text-xs font-medium">Sale</span>
          )}
          {product.isFreeDelivery && (
            <span className="bg-blue-500 text-white px-2 py-0.5 rounded-md text-xs font-medium">Free Delivery</span>
          )}
        </div>
        <div className="absolute top-2 right-2">
          <button 
            className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100 transition duration-300"
            onClick={toggleFavorite}
          >
            <span className={`material-icons ${isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'} transition duration-300`} style={{ fontSize: '18px' }}>
              {isFavorite ? 'favorite' : 'favorite_border'}
            </span>
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center mb-2">
          <img 
            src={getPlatformLogo(product.platform)} 
            alt={getPlatformName(product.platform)} 
            className="w-6 h-6 object-contain mr-2"
          />
          {product.rating && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="material-icons text-yellow-400" style={{ fontSize: '14px' }}>star</span>
              <span className="ml-1">{product.rating.toFixed(1)}</span>
              {product.reviewCount && (
                <span className="ml-1">({product.reviewCount} reviews)</span>
              )}
            </div>
          )}
        </div>

        <h3 className="font-medium text-gray-800 hover:text-primary-600 transition duration-300 h-12 overflow-hidden">
          <a href={product.url} className="block" target="_blank" rel="noopener">
            {product.title}
          </a>
        </h3>

        <div className="mt-2 mb-3">
          <div className="flex items-center">
            <span className="text-lg font-semibold text-gray-900">{formatPrice(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="ml-2 text-sm line-through text-gray-500">{formatPrice(product.originalPrice)}</span>
            )}
            {(product.discount || product.originalPrice) && (
              <span className="ml-2 text-xs text-green-600 font-medium">{calculateDiscount()}</span>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-between">
          <a 
            href={product.url} 
            className="bg-primary-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-primary-600 transition duration-300"
            target="_blank" 
            rel="noopener"
            onClick={handleOutboundClick}
          >
            View on {getPlatformName(product.platform)}
          </a>
          <button 
            className="text-primary-600 border border-primary-500 px-2 py-1 rounded text-sm hover:bg-primary-50 transition duration-300"
            onClick={handleCompareClick}
          >
            Compare
          </button>
        </div>
      </div>
    </div>
  );
}
