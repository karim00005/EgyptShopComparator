import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SearchParams, Product } from "@/utils/types";

interface SearchResults {
  products: Product[];
  totalCount: number;
}

export function useProductSearch(params: SearchParams) {
  const { query, category, priceRange, sort, platforms, page = 1 } = params;
  
  const queryKey = ['products', query, category, priceRange, sort, platforms?.join(','), page];
  
  const { data, isLoading, isError, error } = useQuery<SearchResults>({
    queryKey,
    queryFn: async () => {
      if (!query) {
        return { products: [], totalCount: 0 };
      }
      
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
      
      const res = await fetch(`/api/products/search?${queryParams.toString()}`, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Search failed: ${res.status} ${text}`);
      }
      
      return res.json();
    },
    enabled: !!query,
    keepPreviousData: true
  });
  
  return {
    products: data?.products || [],
    totalCount: data?.totalCount || 0,
    isLoading,
    isError,
    error
  };
}
