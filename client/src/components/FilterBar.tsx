import { useState, useEffect } from "react";
import { useSearch } from "@/context/SearchContext";
import { PlatformPills } from "./PlatformPills";

export function FilterBar() {
  const { searchParams, updateSearchParams } = useSearch();
  const [isGridView, setIsGridView] = useState(true);
  
  const handleCategoryFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSearchParams({
      ...searchParams,
      category: e.target.value,
      page: 1 // Reset to first page on filter change
    });
  };
  
  const handlePriceFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSearchParams({
      ...searchParams,
      priceRange: e.target.value,
      page: 1 // Reset to first page on filter change
    });
  };
  
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSearchParams({
      ...searchParams,
      sort: e.target.value
    });
  };
  
  const handleViewChange = (viewType: 'grid' | 'list') => {
    setIsGridView(viewType === 'grid');
  };
  
  return (
    <>
      <div className="flex items-center justify-between mt-4 pb-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">Category:</span>
            <select 
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
              value={searchParams.category || 'all'}
              onChange={handleCategoryFilter}
            >
              <option value="all">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="grocery">Grocery</option>
              <option value="home">Home & Kitchen</option>
              <option value="fashion">Fashion</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">Price:</span>
            <select 
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
              value={searchParams.priceRange || 'all'}
              onChange={handlePriceFilter}
            >
              <option value="all">Any Price</option>
              <option value="0-500">Under 500 EGP</option>
              <option value="500-1000">500 - 1000 EGP</option>
              <option value="1000-5000">1000 - 5000 EGP</option>
              <option value="5000+">5000+ EGP</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">Sort:</span>
            <select 
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
              value={searchParams.sort || 'price_asc'}
              onChange={handleSortChange}
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rating</option>
              <option value="relevance">Relevance</option>
            </select>
          </div>
          
          <div className="flex items-center border border-gray-300 rounded-md">
            <button 
              className={`px-2 py-1 ${isGridView ? 'bg-primary-100 text-primary-700' : 'text-gray-600'} rounded-l-md border-r border-gray-300`}
              onClick={() => handleViewChange('grid')}
            >
              <span className="material-icons text-sm">grid_view</span>
            </button>
            <button 
              className={`px-2 py-1 ${!isGridView ? 'bg-primary-100 text-primary-700' : 'text-gray-600'} rounded-r-md`}
              onClick={() => handleViewChange('list')}
            >
              <span className="material-icons text-sm">view_list</span>
            </button>
          </div>
        </div>
      </div>
      
      <PlatformPills />
    </>
  );
}
