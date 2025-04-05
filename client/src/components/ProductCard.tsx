import { useState, useEffect } from "react";
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
  
  // State to handle image loading and errors
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Generate a fallback image URL based on platform and title
  const getFallbackImage = () => {
    const platformColors: Record<string, string> = {
      amazon: 'FF9900',
      noon: '56C9F3',
      carrefour: '004E9E',
      talabat: 'FF5A00'
    };
    
    const color = platformColors[product.platform] || '888888';
    const text = encodeURIComponent(product.title.slice(0, 30) || 'Product');
    return `https://ui-avatars.com/api/?name=${text}&background=${color}&color=fff&size=300`;
  };
  
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
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200 hover:-translate-y-1">
      <div className="relative overflow-hidden">
        {/* Loading skeleton */}
        {!imageLoaded && !imageError && (
          <div className="w-full h-52 bg-gray-50 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
          </div>
        )}
        
        <img 
          src={!product.image || imageError ? getFallbackImage() : product.image} 
          alt={product.title} 
          className={`w-full h-52 object-contain bg-white border-b group-hover:scale-105 transition-transform duration-500 ${!imageLoaded && !imageError ? 'hidden' : ''}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
        />
        
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {product.isBestPrice && (
            <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-medium border border-blue-100 shadow-sm">
              Best Price
            </span>
          )}
          {product.isPromotional && (
            <span className="bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-full text-xs font-medium border border-orange-100 shadow-sm">
              Deal
            </span>
          )}
          {product.isFreeDelivery && (
            <span className="bg-green-50 text-green-600 px-2.5 py-0.5 rounded-full text-xs font-medium border border-green-100 shadow-sm">
              Free Shipping
            </span>
          )}
        </div>
        
        {product.discount && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-red-600 to-red-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-sm">
            -{product.discount}%
          </div>
        )}
        
        <div className="absolute bottom-2 right-2">
          <button 
            className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors transform hover:scale-110"
            onClick={toggleFavorite}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <span className={`material-icons ${isFavorite ? 'text-red-500' : 'text-gray-400 group-hover:text-red-400'} transition-colors`} style={{ fontSize: '18px' }}>
              {isFavorite ? 'favorite' : 'favorite_border'}
            </span>
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="w-5 h-5 bg-white rounded-full overflow-hidden flex items-center justify-center shadow-sm mr-2">
              <img 
                src={getPlatformLogo(product.platform)} 
                alt={getPlatformName(product.platform)}
                className="w-4 h-4 object-contain"
                onError={(e) => {
                  // If image fails, replace with the first letter of platform name
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = getPlatformName(product.platform)[0];
                }}
              />
            </div>
            <span className="text-xs font-medium text-gray-500">{getPlatformName(product.platform)}</span>
          </div>
          
          {product.rating && (
            <div className="flex items-center text-sm bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-100">
              <span className="material-icons text-yellow-400" style={{ fontSize: '12px' }}>star</span>
              <span className="ml-0.5 text-xs font-medium text-yellow-700">{product.rating.toFixed(1)}</span>
              {product.reviewCount && (
                <span className="ml-0.5 text-xs text-yellow-600">({product.reviewCount > 999 ? '999+' : product.reviewCount})</span>
              )}
            </div>
          )}
        </div>

        <h3 className="font-medium text-gray-800 group-hover:text-primary-600 transition-colors line-clamp-2 h-12 mb-3 text-sm">
          <a href={product.url} className="block" target="_blank" rel="noopener noreferrer">
            {product.title}
          </a>
        </h3>

        <div className="mb-4">
          <div className="flex items-baseline">
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-primary-500">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="ml-2 text-sm line-through text-gray-400">{formatPrice(product.originalPrice)}</span>
            )}
          </div>
          {(product.discount || (product.originalPrice && product.originalPrice > product.price)) && (
            <span className="text-xs text-green-600 font-medium mt-1 inline-block">
              {calculateDiscount()}
            </span>
          )}
          {product.brand && (
            <div className="mt-1.5 text-xs text-gray-500 inline-block bg-gray-50 px-2 py-0.5 rounded-full">
              {product.brand}
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <a 
            href={product.url} 
            className="flex-1 bg-gradient-to-r from-primary-600 to-primary-500 text-white px-3 py-2 rounded-lg text-sm font-medium 
                       hover:from-primary-700 hover:to-primary-600 transition-all shadow-sm 
                       text-center flex items-center justify-center gap-1 group-hover:shadow-md"
            target="_blank" 
            rel="noopener noreferrer"
            onClick={handleOutboundClick}
          >
            <span className="material-icons text-sm">open_in_new</span>
            <span>Buy Now</span>
          </a>
          <button 
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all 
                     flex items-center justify-center gap-1 shadow-sm hover:border-gray-300"
            onClick={handleCompareClick}
            aria-label="Compare"
          >
            <span className="material-icons text-sm text-gray-600">compare</span>
            <span className="text-xs font-medium text-gray-600">Compare</span>
          </button>
        </div>
      </div>
    </div>
  );
}
