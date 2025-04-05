import { useState, useEffect } from "react";
import { useSearch } from "@/context/SearchContext";
import { PlatformPills } from "./PlatformPills";

export function FilterBar() {
  const { searchParams, updateSearchParams } = useSearch();
  const [isGridView, setIsGridView] = useState(true);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  
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
      sort: e.target.value,
      page: 1
    });
  };
  
  const handleViewChange = (viewType: 'grid' | 'list') => {
    setIsGridView(viewType === 'grid');
  };
  
  const toggleFilter = () => {
    setIsFilterExpanded(!isFilterExpanded);
  };
  
  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={toggleFilter}
          className="md:hidden flex items-center text-sm text-gray-600 hover:text-primary-500 transition-colors px-2 py-1 rounded-lg border border-gray-200 bg-white"
        >
          <span className="material-icons text-sm mr-1">filter_list</span>
          Filters
          <span className="material-icons text-sm ml-1">{isFilterExpanded ? 'expand_less' : 'expand_more'}</span>
        </button>
        
        <div className="hidden md:flex flex-wrap md:flex-nowrap items-center gap-2 flex-grow">
          <div className="flex items-center relative group">
            <div className="absolute inset-0 bg-gray-50 rounded-lg border border-gray-200 -z-10 group-hover:border-gray-300 transition-colors"></div>
            <label className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors px-3">Category</label>
            <select 
              className="text-sm py-2 pr-8 pl-2 font-medium appearance-none bg-transparent focus:outline-none border-l border-gray-200"
              value={searchParams.category || 'all'}
              onChange={handleCategoryFilter}
            >
              <option value="all">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="grocery">Grocery</option>
              <option value="home">Home & Kitchen</option>
              <option value="fashion">Fashion</option>
            </select>
            <span className="material-icons text-gray-400 text-sm absolute right-2 pointer-events-none">arrow_drop_down</span>
          </div>
          
          <div className="flex items-center relative group">
            <div className="absolute inset-0 bg-gray-50 rounded-lg border border-gray-200 -z-10 group-hover:border-gray-300 transition-colors"></div>
            <label className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors px-3">Price</label>
            <select 
              className="text-sm py-2 pr-8 pl-2 font-medium appearance-none bg-transparent focus:outline-none border-l border-gray-200"
              value={searchParams.priceRange || 'all'}
              onChange={handlePriceFilter}
            >
              <option value="all">Any Price</option>
              <option value="0-500">Under 500 EGP</option>
              <option value="500-1000">500 - 1000 EGP</option>
              <option value="1000-5000">1000 - 5000 EGP</option>
              <option value="5000+">5000+ EGP</option>
            </select>
            <span className="material-icons text-gray-400 text-sm absolute right-2 pointer-events-none">arrow_drop_down</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center relative group">
            <div className="absolute inset-0 bg-gray-50 rounded-lg border border-gray-200 -z-10 group-hover:border-gray-300 transition-colors"></div>
            <label className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors px-3">Sort</label>
            <select 
              className="text-sm py-2 pr-8 pl-2 font-medium appearance-none bg-transparent focus:outline-none border-l border-gray-200"
              value={searchParams.sort || 'price_asc'}
              onChange={handleSortChange}
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rating</option>
              <option value="relevance">Relevance</option>
            </select>
            <span className="material-icons text-gray-400 text-sm absolute right-2 pointer-events-none">arrow_drop_down</span>
          </div>
          
          <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
            <button 
              className={`px-2.5 py-2 transition-colors ${isGridView ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => handleViewChange('grid')}
              aria-label="Grid view"
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>grid_view</span>
            </button>
            <button 
              className={`px-2.5 py-2 transition-colors ${!isGridView ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => handleViewChange('list')}
              aria-label="List view"
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>view_list</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile filters (shown when expanded) */}
      <div className={`md:hidden transition-all duration-300 overflow-hidden ${isFilterExpanded ? 'max-h-40 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
        <div className="bg-gray-50 rounded-lg p-3 space-y-3 border border-gray-200">
          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-700 mr-2 min-w-[70px]">Category:</label>
            <select 
              className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-300 focus:border-primary-500 bg-white flex-grow"
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
              className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-300 focus:border-primary-500 bg-white flex-grow"
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
      </div>
      
      <PlatformPills />
    </div>
  );
}
