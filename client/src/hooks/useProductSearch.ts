import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { SearchParams, Product } from "../../../shared/schema";

interface SearchResults {
  products: Product[];
  totalCount: number;
}

export function useProductSearch(params: SearchParams) {
  const { query, category, priceRange, sort, platforms, page = 1 } = params;
  
  const queryKey = ['products', query, category, priceRange, sort, platforms?.join(','), page];
  
  const { data, isLoading, isError, error, isFetching } = useQuery<SearchResults>({
    queryKey,
    queryFn: async () => {
      if (!query) {
        return { products: [], totalCount: 0 };
      }
      
      console.log("Fetching products for query:", query);
      
      // Build the query string
      const queryParams = new URLSearchParams();
      queryParams.append('q', query);
      
      if (category && category !== 'all') {
        queryParams.append('category', category);
      }
      
      if (priceRange && priceRange !== 'all') {
        queryParams.append('priceRange', priceRange);
      }
      
      if (sort) {
        queryParams.append('sort', sort);
      }
      
      if (page > 1) {
        queryParams.append('page', page.toString());
      }
      
      if (platforms && platforms.length > 0) {
        queryParams.append('platforms', platforms.join(','));
      }
      
      try {
        const res = await fetch(`/api/products/search?${queryParams.toString()}`, {
          credentials: 'include',
        });
        
        if (!res.ok) {
          const text = await res.text();
          console.error("Search API error:", text);
          throw new Error(`Search failed: ${res.status} ${text}`);
        }
        
        const data = await res.json();
        console.log("Received products:", data.products.length);
        return data;
      } catch (err) {
        console.error("Error fetching products:", err);
        throw err;
      }
    },
    enabled: !!query,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    retry: 1
  });
  
  // Use isFetching as well as isLoading to prevent flashing while re-fetching
  const isLoadingProducts = isLoading || isFetching;
  
  return {
    products: data?.products || [],
    totalCount: data?.totalCount || 0,
    isLoading: isLoadingProducts,
    isError,
    error
  };
}
