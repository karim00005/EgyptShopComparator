import { useState, useEffect, useRef } from "react";
import { useSearch } from "../context/SearchContext";
import { useLanguage } from "../context/LanguageContext";
import { useLocation } from "wouter";
import { useProductSearch } from "../hooks/useProductSearch";

export function SearchBar() {
  const [_, navigate] = useLocation();
  const { searchParams, updateSearchParams } = useSearch();
  const { language, t, isRTL } = useLanguage();
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
    <div dir={isRTL ? 'rtl' : 'ltr'} className="w-full md:w-2/3 lg:w-1/2 relative">
      <div className="relative flex shadow-md rounded-xl overflow-hidden">
        <div className="relative flex-grow">
          <input 
            type="text" 
            placeholder={t('search.placeholder')}
            className={`w-full py-3.5 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} border-0 focus:ring-2 focus:ring-primary-300 focus:outline-none transition-all text-gray-800`}
            value={searchInput}
            onChange={handleSearchInput}
            onKeyDown={handleKeyDown}
            disabled={isSearchActive}
          />
          <div className={`absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-3.5 text-gray-400 flex items-center transition-all duration-200`}>
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
          className={`px-6 py-3.5 font-medium transition-all flex items-center justify-center min-w-[120px] ${
            isSearchActive 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : 'bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-700 hover:to-primary-600'
          }`}
          onClick={handleSearch}
          disabled={isSearchActive}
        >
          {isSearchActive ? (
            <div className="flex items-center justify-center">
              <span className={isRTL ? 'ml-2' : 'mr-2'}>{t('search.searching')}</span>
              <div className="flex space-x-0.5">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <span>{t('search.button')}</span>
              <svg className={`${isRTL ? 'mr-2 rotate-180' : 'ml-2'} h-4 w-4`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>
      </div>
      
      {!isSearchActive && searchInput.length >= 2 && (
        <div className={`absolute ${isRTL ? 'left-1' : 'right-1'} -bottom-5 text-xs text-gray-500`}>
          {t('search.pressEnter')}
        </div>
      )}
    </div>
  );
}
