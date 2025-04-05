import { createContext, useContext, useState, ReactNode } from "react";
import { SearchParams } from "@/utils/types";

interface SearchContextProps {
  searchParams: SearchParams;
  updateSearchParams: (params: SearchParams) => void;
}

const SearchContext = createContext<SearchContextProps | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: "",
    category: "all",
    priceRange: "all",
    sort: "price_asc",
    page: 1,
    platforms: ["amazon", "noon", "carrefour", "talabat"]
  });
  
  const updateSearchParams = (params: SearchParams) => {
    setSearchParams(params);
  };
  
  return (
    <SearchContext.Provider value={{ searchParams, updateSearchParams }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
