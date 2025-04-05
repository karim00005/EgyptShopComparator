import { useState, useEffect } from "react";
import { useSearch } from "@/context/SearchContext";
import { useLocation } from "wouter";

export function SearchBar() {
  const [_, navigate] = useLocation();
  const { searchParams, updateSearchParams } = useSearch();
  const [searchInput, setSearchInput] = useState(searchParams.query || "");
  
  // Update input when searchParams change (e.g. when navigating)
  useEffect(() => {
    setSearchInput(searchParams.query || "");
  }, [searchParams.query]);
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput && searchInput !== searchParams.query) {
        handleSearch();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchInput]);
  
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };
  
  const handleSearch = () => {
    if (searchInput.trim()) {
      updateSearchParams({
        ...searchParams,
        query: searchInput.trim(),
        page: 1 // Reset to first page on new search
      });
      navigate("/"); // Navigate to home page for search results
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  
  return (
    <div className="w-full md:w-2/3 lg:w-1/2 relative">
      <div className="relative">
        <input 
          type="text" 
          placeholder="Search products across all platforms..." 
          className="w-full py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none transition"
          value={searchInput}
          onChange={handleSearchInput}
          onKeyDown={handleKeyDown}
        />
        <span className="absolute left-3 top-2.5 text-gray-400 material-icons">search</span>
        <button 
          className="absolute right-2 top-1.5 bg-primary-500 text-white px-3 py-1 rounded-md hover:bg-primary-600 transition"
          onClick={handleSearch}
        >
          Search
        </button>
      </div>
    </div>
  );
}
