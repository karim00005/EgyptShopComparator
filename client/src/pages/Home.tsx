import { useState, useEffect, useRef } from "react";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { PaginationControls } from "@/components/PaginationControls";
import { useSearch } from "@/context/SearchContext";
import { useProductSearch } from "@/hooks/useProductSearch";
import { Product } from "@/utils/types";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { searchParams } = useSearch();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState<string | null>(null);
  const firstRenderRef = useRef(true);
  
  // Fetch products based on search params
  const { products, totalCount, isLoading, isError } = useProductSearch(searchParams);
  
  // Track the last search query to avoid UI flashing when search changes
  useEffect(() => {
    if (searchParams.query) {
      setLastSearchQuery(searchParams.query);
    }
  }, [searchParams.query]);
  
  // Show loading toast only on first render with a query
  useEffect(() => {
    if (firstRenderRef.current && searchParams.query && isLoading) {
      toast({
        title: "Searching across platforms",
        description: "This may take a few seconds as we gather the latest prices",
        duration: 3000
      });
      firstRenderRef.current = false;
    }
  }, [isLoading, searchParams.query]);
  
  const handleCompareClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    // Don't clear selected product immediately to avoid UI flickers
    setTimeout(() => setSelectedProduct(null), 300);
  };
  
  // Determine if we should show the no results message
  const showNoResults = searchParams.query && 
                        !isLoading && 
                        products.length === 0 && 
                        lastSearchQuery === searchParams.query;
  
  // Determine if we should show the welcome/empty state
  const showWelcome = !searchParams.query && !isLoading;
  
  // Determine if we should show the results
  const showResults = !isLoading && products.length > 0;
  
  return (
    <main className="container mx-auto px-4 py-6">
      {/* Search Results Summary - only show when products are loaded */}
      {showResults && searchParams.query && (
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            Results for "{searchParams.query}"
          </h2>
          <span className="text-sm text-gray-600">
            {totalCount} products found
          </span>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div>
          <div className="mb-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-2"></div>
            <p className="text-gray-600">Searching across {searchParams.platforms?.length || 4} platforms...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => (
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
        </div>
      )}
      
      {/* Error State */}
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold">Error fetching products</h3>
          <p>Please try again later or refine your search query.</p>
          <button 
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            onClick={() => window.location.reload()}
          >
            Retry Search
          </button>
        </div>
      )}
      
      {/* Empty State - No query */}
      {showWelcome && (
        <div className="text-center py-10">
          <div className="mb-4">
            <span className="material-icons text-primary-400 text-6xl">search</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Search for products</h2>
          <p className="text-gray-600 max-w-lg mx-auto">
            Enter a product name in the search bar above to compare prices across Amazon Egypt, Noon, Carrefour Egypt, and Talabat.
          </p>
        </div>
      )}
      
      {/* Empty State - No results */}
      {showNoResults && (
        <div className="text-center py-10">
          <div className="mb-4">
            <span className="material-icons text-gray-400 text-6xl">sentiment_dissatisfied</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">No products found</h2>
          <p className="text-gray-600 max-w-lg mx-auto">
            We couldn't find any products matching "{searchParams.query}". Try using different keywords or adjusting your filters.
          </p>
          <button 
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition"
            onClick={() => toast({
              title: "Tips for better results",
              description: "Try using general terms, check spelling, or reduce filters",
            })}
          >
            Search tips
          </button>
        </div>
      )}
      
      {/* Product Grid */}
      {showResults && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard 
              key={`${product.platform}-${product.id}`} 
              product={product} 
              onCompareClick={handleCompareClick}
            />
          ))}
        </div>
      )}
      
      {/* Pagination Controls */}
      {showResults && totalCount > 0 && (
        <div className="mt-8">
          <PaginationControls totalItems={totalCount} />
        </div>
      )}
      
      {/* Product Detail Modal */}
      <ProductDetailModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        product={selectedProduct} 
        similarProducts={selectedProduct ? products.filter(p => 
          p.id !== selectedProduct.id && 
          p.platform !== selectedProduct.platform
        ) : []}
      />
    </main>
  );
}
