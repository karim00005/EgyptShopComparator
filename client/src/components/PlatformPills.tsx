import { useState } from "react";
import { useSearch } from "@/context/SearchContext";

const PLATFORMS = [
  {
    id: 'amazon',
    name: 'Amazon Egypt',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/320px-Amazon_logo.svg.png'
  },
  {
    id: 'noon',
    name: 'Noon',
    logo: 'https://e7.pngegg.com/pngimages/178/595/png-clipart-noon-hd-logo-thumbnail.png'
  },
  {
    id: 'carrefour',
    name: 'Carrefour',
    logo: 'https://play-lh.googleusercontent.com/Zz_8v5v8tKY4ZyNHwh0gU_P5JrQ018GYmpyui0r3-rC4S8qtd4LtWN0K9Z6KMUb4KA'
  },
  {
    id: 'talabat',
    name: 'Talabat',
    logo: 'https://play-lh.googleusercontent.com/KhGz6kt8AOi0vQSbH3cCH9jHQVw7oebQ9S9MUuKiLANhkdW6wfiHcl3uGVT4uoJR37wu'
  }
];

export function PlatformPills() {
  const { searchParams, updateSearchParams } = useSearch();
  const activePlatforms = searchParams.platforms || PLATFORMS.map(p => p.id);
  
  const togglePlatform = (platformId: string) => {
    let newPlatforms: string[];
    
    if (activePlatforms.includes(platformId)) {
      // Don't allow removing all platforms
      if (activePlatforms.length === 1) return;
      newPlatforms = activePlatforms.filter(p => p !== platformId);
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
    <div className="mb-6 flex flex-wrap gap-2 mt-4">
      {PLATFORMS.map(platform => (
        <button 
          key={platform.id}
          className={`flex items-center px-3 py-1 ${
            activePlatforms.includes(platform.id) 
              ? 'bg-primary-100 text-primary-800' 
              : 'bg-gray-100 text-gray-600'
          } rounded-full border ${
            activePlatforms.includes(platform.id) 
              ? 'border-primary-200 hover:bg-primary-200' 
              : 'border-gray-200 hover:bg-gray-200'
          } transition`}
          onClick={() => togglePlatform(platform.id)}
        >
          <img src={platform.logo} alt={platform.name} className="w-4 h-4 mr-2" />
          <span className="text-xs font-medium">{platform.name}</span>
          {activePlatforms.includes(platform.id) && (
            <span className="material-icons text-sm ml-1">check</span>
          )}
        </button>
      ))}
    </div>
  );
}
