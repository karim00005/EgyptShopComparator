import { useState } from "react";
import { Link, useLocation } from "wouter";
import { SearchBar } from "./SearchBar";
import { FilterBar } from "./FilterBar";
import { useSearch } from "@/context/SearchContext";

export function AppHeader() {
  const [_, navigate] = useLocation();
  const { searchParams, updateSearchParams } = useSearch();
  
  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <Link href="/">
              <a className="text-xl font-bold text-primary-600 mr-2">PriceWise Egypt</a>
            </Link>
            <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">Beta</span>
          </div>
          
          <SearchBar />
          
          <div className="flex mt-4 md:mt-0 md:ml-4 space-x-2">
            <Link href="/favorites">
              <a className="flex items-center text-gray-600 hover:text-primary-500 transition">
                <span className="material-icons text-sm mr-1">favorite_border</span>
                <span className="text-sm">Favorites</span>
              </a>
            </Link>
            <button className="flex items-center text-gray-600 hover:text-primary-500 transition">
              <span className="material-icons text-sm mr-1">notifications_none</span>
              <span className="text-sm">Alerts</span>
            </button>
            <button className="flex items-center text-gray-600 hover:text-primary-500 transition">
              <span className="material-icons text-sm mr-1">person_outline</span>
              <span className="text-sm">Login</span>
            </button>
          </div>
        </div>

        <FilterBar />
      </div>
    </header>
  );
}
