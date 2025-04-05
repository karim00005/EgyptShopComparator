import { useState } from "react";
import { useFavorites } from "@/context/FavoritesContext";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { Product } from "@/utils/types";
import { useToast } from "@/hooks/use-toast";

export default function Favorites() {
  const { favorites, favoriteProducts, isLoading } = useFavorites();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleCompareClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };
  
  return (
    <main className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Your Favorites</h1>
        <p className="text-gray-600">
          Products you've saved for later comparison and price tracking.
        </p>
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
              <div className="h-48 bg-gray-200 rounded mb-4 skeleton"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 skeleton"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 skeleton"></div>
              <div className="h-8 bg-gray-200 rounded mb-2 skeleton"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2 skeleton"></div>
              <div className="h-4 bg-gray-200 rounded w-4/5 skeleton"></div>
            </div>
          ))}
        </div>
      )}
      
      {/* Empty State */}
      {!isLoading && favoriteProducts.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <div className="mb-4">
            <span className="material-icons text-gray-400 text-6xl">favorite_border</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No favorites yet</h2>
          <p className="text-gray-600 max-w-lg mx-auto mb-4">
            Start adding products to your favorites list by clicking the heart icon on any product card.
          </p>
          <button 
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition"
            onClick={() => toast({
              title: "Tip",
              description: "Search for products and click the heart icon to add them to favorites.",
            })}
          >
            Browse products
          </button>
        </div>
      )}
      
      {/* Favorites Grid */}
      {!isLoading && favoriteProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favoriteProducts.map((product) => (
            <ProductCard 
              key={`${product.platform}-${product.id}`}
              product={product}
              onCompareClick={handleCompareClick}
            />
          ))}
        </div>
      )}
      
      {/* Product Detail Modal */}
      <ProductDetailModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        product={selectedProduct} 
        similarProducts={selectedProduct ? favoriteProducts.filter(p => 
          p.id !== selectedProduct.id && 
          p.platform !== selectedProduct.platform
        ) : []}
      />
    </main>
  );
}
