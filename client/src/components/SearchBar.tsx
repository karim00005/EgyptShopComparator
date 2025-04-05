import { useState, useEffect, useRef } from "react";
import { useSearch } from "@/context/SearchContext";
import { useLocation } from "wouter";
import { useProductSearch } from "@/hooks/useProductSearch";

export function SearchBar() {
  const [_, navigate] = useLocation();
  const { searchParams, updateSearchParams } = useSearch();
  const [searchInput, setSearchInput] = useState(searchParams.query || "");
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get loading state from the query hook
  const { isLoading } = useProductSearch(searchParams);
  
  // Combine local and remote loading states
  const isSearchActive = isLoading || isSearching;
  
  // Update input when searchParams change (e.g. when navigating)
  useEffect(() => {
    setSearchInput(searchParams.query || "");
  }, [searchParams.query]);
  
  // Clean up the debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };
  
  const handleSearch = () => {
    // Don't perform empty searches
    if (!searchInput.trim()) {
      return;
    }
    
    // Don't trigger search if input is the same as current search
    if (searchInput.trim() === searchParams.query) {
      return;
    }
    
    setIsSearching(true);
    
    // Cancel any pending debounced search
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Update the search parameters
    updateSearchParams({
      ...searchParams,
      query: searchInput.trim(),
      page: 1 // Reset to first page on new search
    });
    
    // Navigate to home page for search results
    navigate("/");
    
    // Reset searching state after a short delay to allow UI to update
    setTimeout(() => setIsSearching(false), 300);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };
  
  // Debounced search
  const debouncedSearch = () => {
    // Cancel any pending debounced search
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Only set up debounce if input is different from current search
    if (searchInput.trim() && searchInput.trim() !== searchParams.query) {
      debounceTimerRef.current = setTimeout(() => {
        handleSearch();
      }, 800); // Longer debounce time for better UX
    }
  };
  
  // Trigger debounced search when input changes
  useEffect(() => {
    debouncedSearch();
  }, [searchInput]);
  
  return (
    <div className="w-full md:w-2/3 lg:w-1/2 relative">
      <div className="relative flex shadow-sm">
        <div className="relative flex-grow">
          <input 
            type="text" 
            placeholder="Search products across all platforms..." 
            className="w-full py-3 pl-12 pr-4 rounded-l-lg border border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-300 focus:outline-none transition-all"
            value={searchInput}
            onChange={handleSearchInput}
            onKeyDown={handleKeyDown}
            disabled={isSearchActive}
          />
          <div className="absolute left-3 top-3 text-gray-400 flex items-center transition-all duration-200">
            {isSearchActive ? (
              <svg className="animate-spin h-6 w-6 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>
        <button 
          className={`px-6 py-3 rounded-r-lg font-medium transition-all ${
            isSearchActive 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : 'bg-primary-500 text-white hover:bg-primary-600'
          } flex items-center justify-center min-w-[100px]`}
          onClick={handleSearch}
          disabled={isSearchActive}
        >
          {isSearchActive ? (
            <>
              <span className="mr-2">Searching</span>
              <span className="flex space-x-1">
                <span className="animate-pulse delay-0">.</span>
                <span className="animate-pulse delay-100">.</span>
                <span className="animate-pulse delay-200">.</span>
              </span>
            </>
          ) : 'Search'}
        </button>
      </div>
    </div>
  );
}
