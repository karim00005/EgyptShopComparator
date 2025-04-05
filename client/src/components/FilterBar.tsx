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
    <div className="flex flex-col w-full">
      <div className="flex flex-wrap md:flex-nowrap items-center gap-3 mb-2">
        <div className="flex items-center">
          <label className="text-sm font-medium text-gray-700 mr-2 min-w-[70px]">Category:</label>
          <select 
            className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-300 focus:border-primary-500 bg-white"
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
          <label className="text-sm font-medium text-gray-700 mr-2 min-w-[70px]">Price:</label>
          <select 
            className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-300 focus:border-primary-500 bg-white"
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
        
        <div className="flex items-center">
          <label className="text-sm font-medium text-gray-700 mr-2 min-w-[70px]">Sort By:</label>
          <select 
            className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-300 focus:border-primary-500 bg-white"
            value={searchParams.sort || 'price_asc'}
            onChange={handleSortChange}
          >
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rating</option>
            <option value="relevance">Relevance</option>
          </select>
        </div>
        
        <div className="ml-auto flex items-center border border-gray-300 rounded-md">
          <button 
            className={`px-2 py-1.5 ${isGridView ? 'bg-primary-100 text-primary-700' : 'text-gray-600'} rounded-l-md border-r border-gray-300`}
            onClick={() => handleViewChange('grid')}
          >
            <span className="material-icons text-sm">grid_view</span>
          </button>
          <button 
            className={`px-2 py-1.5 ${!isGridView ? 'bg-primary-100 text-primary-700' : 'text-gray-600'} rounded-r-md`}
            onClick={() => handleViewChange('list')}
          >
            <span className="material-icons text-sm">view_list</span>
          </button>
        </div>
      </div>
      
      <PlatformPills />
    </div>
  );
}
