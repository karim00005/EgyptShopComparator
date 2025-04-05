import { useState, useEffect } from "react";
import { useSearch } from "../context/SearchContext";

// More reliable logo URLs with better quality
const PLATFORMS = [
  {
    id: 'amazon',
    name: 'Amazon Egypt',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/320px-Amazon_logo.svg.png',
    color: '#FF9900'
  },
  {
    id: 'noon',
    name: 'Noon',
    logo: 'https://logos-world.net/wp-content/uploads/2021/08/Noon-Symbol.png',
    color: '#FEEE00'
  },
  {
    id: 'carrefour',
    name: 'Carrefour',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Carrefour_logo.svg/800px-Carrefour_logo.svg.png',
    color: '#004E9F'
  },
  {
    id: 'talabat',
    name: 'Talabat',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cd/Talabat_Logo.svg/1200px-Talabat_Logo.svg.png',
    color: '#FF5A00'
  },
  {
    id: 'jumia',
    name: 'Jumia',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Jumia_Logo.svg/1200px-Jumia_Logo.svg.png',
    color: '#F68B1E'
  }
];

export function PlatformPills() {
  const { searchParams, updateSearchParams } = useSearch();
  const activePlatforms = searchParams.platforms || PLATFORMS.map((p: {id: string}) => p.id);
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);
  
  const togglePlatform = (platformId: string) => {
    let newPlatforms: string[];
    
    if (activePlatforms.includes(platformId)) {
      // Don't allow removing all platforms
      if (activePlatforms.length === 1) return;
      newPlatforms = activePlatforms.filter((p: string) => p !== platformId);
    } else {
      newPlatforms = [...activePlatforms, platformId];
    }
    
    updateSearchParams({
      ...searchParams,
      platforms: newPlatforms,
      page: 1 // Reset to first page on platform change
    });
  };
  
  return (
    <div className="mb-6 mt-2">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Compare prices across</h3>
      <div className="flex flex-wrap gap-3">
        {PLATFORMS.map(platform => {
          const isActive = activePlatforms.includes(platform.id);
          const isHovered = hoveredPlatform === platform.id;
          
          return (
            <button 
              key={platform.id}
              className={`relative flex items-center px-4 py-2.5 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-white text-gray-800 ring-2 ring-primary-500 shadow-md' 
                  : 'bg-gray-50 text-gray-600 hover:bg-white hover:shadow-sm border border-gray-100'
              }`}
              onClick={() => togglePlatform(platform.id)}
              onMouseEnter={() => setHoveredPlatform(platform.id)}
              onMouseLeave={() => setHoveredPlatform(null)}
              style={{
                transform: isHovered ? 'translateY(-2px)' : 'none'
              }}
            >
              <div className="w-6 h-6 mr-2 rounded-full overflow-hidden flex items-center justify-center bg-white shadow-sm">
                <img 
                  src={platform.logo} 
                  alt={platform.name} 
                  className="w-5 h-5 object-contain" 
                  onError={(e) => {
                    // If image fails, replace with the first letter of platform name
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = platform.name[0];
                  }}
                />
              </div>
              <span className="text-sm font-medium">{platform.name}</span>
              
              {isActive && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-white">
                  <span className="material-icons" style={{ fontSize: '14px' }}>check</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
