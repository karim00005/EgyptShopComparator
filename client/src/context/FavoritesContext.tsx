import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { FavoriteProduct, Product } from "@/utils/types";
import { useToast } from "@/hooks/use-toast";

interface FavoritesContextProps {
  favorites: FavoriteProduct[];
  favoriteProducts: Product[];
  isLoading: boolean;
  addFavorite: (favorite: FavoriteProduct) => void;
  removeFavorite: (productId: string, platform: string) => void;
}

const FavoritesContext = createContext<FavoritesContextProps | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  
  // Mock user ID (in a real app, this would come from authentication)
  const userId = 1;
  
  // Fetch favorites
  const { data: favoriteProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ["favorites", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      try {
        const response = await fetch(`/api/favorites?userId=${userId}`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch favorites');
        }
        
        return response.json();
      } catch (error) {
        console.error("Error fetching favorites:", error);
        return [];
      }
    },
    enabled: !!userId
  });
  
  // Update favorites when products are fetched
  useEffect(() => {
    if (favoriteProducts.length > 0) {
      // Create favorite objects from the products
      const favs = favoriteProducts.map(product => ({
        userId,
        productId: product.id,
        platform: product.platform,
        dateAdded: new Date()
      }));
      
      setFavorites(favs);
    }
  }, [favoriteProducts, userId]);
  
  // Add favorite mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async (favorite: FavoriteProduct) => {
      return apiRequest('POST', '/api/favorites', favorite);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", userId] });
      toast({
        title: "Added to favorites",
        description: "The product has been added to your favorites.",
      });
    },
    onError: (error) => {
      console.error("Error adding favorite:", error);
      toast({
        title: "Failed to add favorite",
        description: "There was an error adding the product to your favorites.",
        variant: "destructive",
      });
    }
  });
  
  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async ({ productId, platform }: { productId: string, platform: string }) => {
      return apiRequest('DELETE', '/api/favorites', { userId, productId, platform });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", userId] });
      toast({
        title: "Removed from favorites",
        description: "The product has been removed from your favorites.",
      });
    },
    onError: (error) => {
      console.error("Error removing favorite:", error);
      toast({
        title: "Failed to remove favorite",
        description: "There was an error removing the product from your favorites.",
        variant: "destructive",
      });
    }
  });
  
  const addFavorite = (favorite: FavoriteProduct) => {
    // Optimistic update
    setFavorites(prev => [...prev, favorite]);
    addFavoriteMutation.mutate(favorite);
  };
  
  const removeFavorite = (productId: string, platform: string) => {
    // Optimistic update
    setFavorites(prev => prev.filter(fav => 
      fav.productId !== productId || fav.platform !== platform
    ));
    removeFavoriteMutation.mutate({ productId, platform });
  };
  
  return (
    <FavoritesContext.Provider value={{
      favorites,
      favoriteProducts,
      isLoading,
      addFavorite,
      removeFavorite
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
