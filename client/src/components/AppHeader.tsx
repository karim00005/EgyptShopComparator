import { useState } from "react";
import { Link, useLocation } from "wouter";
import { SearchBar } from "./SearchBar";
import { FilterBar } from "./FilterBar";
import { useSearch } from "@/context/SearchContext";

export function AppHeader() {
  const [_, navigate] = useLocation();
  const { searchParams, updateSearchParams } = useSearch();
  
  return (
    <header className="sticky top-0 z-50 shadow-md">
      <div className="bg-primary-600 text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-white">
              PriceWise Egypt
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link href="/favorites" className="flex items-center text-white hover:text-white/90 transition">
                <span className="material-icons text-sm mr-1">favorite_border</span>
                <span className="text-sm">Favorites</span>
              </Link>
              <button className="flex items-center text-white hover:text-white/90 transition">
                <span className="material-icons text-sm mr-1">notifications_none</span>
                <span className="text-sm">Alerts</span>
              </button>
              <button className="flex items-center text-white hover:text-white/90 transition">
                <span className="material-icons text-sm mr-1">person_outline</span>
                <span className="text-sm">Login</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white py-3">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <SearchBar />
            <FilterBar />
          </div>
        </div>
      </div>
    </header>
  );
}
