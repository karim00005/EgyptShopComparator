import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { SearchBar } from "./SearchBar";
import { FilterBar } from "./FilterBar";
import { useSearch } from "../context/SearchContext";
import { useLanguage } from "../context/LanguageContext";

export function AppHeader() {
  const [_, navigate] = useLocation();
  const { searchParams, updateSearchParams } = useSearch();
  const { language, setLanguage, t } = useLanguage();
  const isRTL = language === 'ar';

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <header dir={isRTL ? 'rtl' : 'ltr'} className="relative">
      <div className="bg-primary-700 text-white py-3">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md">
                <span className="material-icons text-primary-600" style={{ fontSize: '20px' }}>
                  price_check
                </span>
              </div>
              <div>
                <span className="text-xl font-bold text-white group-hover:text-blue-50 transition-all duration-300">
                  {t('header.appName')}
                </span>
                <span className="text-sm font-medium text-blue-50 ml-1">{t('header.country')}</span>
              </div>
            </Link>
            
            <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
              <button
                onClick={toggleLanguage}
                className="flex items-center text-white hover:text-white transition-all duration-200 hover:bg-primary-500/30 rounded-full py-1 px-3 border border-white/20"
              >
                <span className="material-icons text-sm mr-1.5">{language === 'en' ? 'translate' : 'language'}</span>
                <span className="text-sm font-medium">{language === 'en' ? 'العربية' : 'English'}</span>
              </button>
              
              <Link 
                href="/favorites" 
                className="flex items-center text-white hover:text-white transition-all duration-200 hover:bg-primary-500/30 rounded-full py-1 px-3"
              >
                <span className="material-icons text-sm mr-1.5">favorite_border</span>
                <span className="text-sm font-medium">{t('header.favorites')}</span>
              </Link>
              
              <button 
                className="flex items-center text-white hover:text-white transition-all duration-200 hover:bg-primary-500/30 rounded-full py-1 px-3"
              >
                <span className="material-icons text-sm mr-1.5">notifications_none</span>
                <span className="text-sm font-medium">{t('header.alerts')}</span>
              </button>
              
              <button 
                className="flex items-center text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 rounded-full py-1.5 px-4 ml-2 shadow-sm"
              >
                <span className="material-icons text-sm mr-1.5">person_outline</span>
                <span className="text-sm font-medium">{t('header.login')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div dir={isRTL ? 'rtl' : 'ltr'} className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${isRTL ? 'md:space-x-reverse md:space-x-4' : 'md:space-x-4'}`}>
            <SearchBar />
            <FilterBar />
          </div>
        </div>
      </div>
    </header>
  );
}
