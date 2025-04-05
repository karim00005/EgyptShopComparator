import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { SearchBar } from "./SearchBar";
import { FilterBar } from "./FilterBar";
import { useSearch } from "@/context/SearchContext";

export function AppHeader() {
  const [_, navigate] = useLocation();
  const { searchParams, updateSearchParams } = useSearch();
  const [scrolled, setScrolled] = useState(false);
  
  // Add scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-lg' : 'shadow-md'}`}>
      <div className="bg-gradient-to-r from-primary-700 to-primary-600 text-white py-3">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md">
                <span className="material-icons text-primary-600" style={{ fontSize: '20px' }}>
                  price_check
                </span>
              </div>
              <div>
                <span className="text-xl font-bold text-white bg-clip-text bg-gradient-to-r from-white to-blue-100 group-hover:text-blue-50 transition-all duration-300">
                  PriceWise
                </span>
                <span className="text-sm font-medium opacity-80 ml-1">Egypt</span>
              </div>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/favorites" 
                className="flex items-center text-white hover:text-white/90 transition-all duration-200 hover:bg-primary-500/20 rounded-full py-1 px-3"
              >
                <span className="material-icons text-sm mr-1.5">favorite_border</span>
                <span className="text-sm font-medium">Favorites</span>
              </Link>
              <button 
                className="flex items-center text-white hover:text-white/90 transition-all duration-200 hover:bg-primary-500/20 rounded-full py-1 px-3"
              >
                <span className="material-icons text-sm mr-1.5">notifications_none</span>
                <span className="text-sm font-medium">Alerts</span>
              </button>
              <button 
                className="flex items-center text-white bg-primary-500/20 hover:bg-primary-500/30 transition-all duration-200 rounded-full py-1.5 px-4 ml-2"
              >
                <span className="material-icons text-sm mr-1.5">person_outline</span>
                <span className="text-sm font-medium">Login</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className={`bg-white py-4 transition-all duration-300 ${scrolled ? 'py-3' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 justify-between gap-4">
            <SearchBar />
            <FilterBar />
          </div>
        </div>
      </div>
    </header>
  );
}
