import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Define available languages
type Language = 'en' | 'ar';

// Translation interface
interface Translations {
  [key: string]: string | { [key: string]: string | { [key: string]: string } };
}

// English translations
const enTranslations: Translations = {
  header: {
    appName: 'PriceWise',
    country: 'Egypt',
    favorites: 'Favorites',
    alerts: 'Alerts',
    login: 'Login',
  },
  search: {
    placeholder: 'Search products across all platforms...',
    button: 'Search',
    searching: 'Searching',
    pressEnter: 'Press Enter to search',
  },
  filter: {
    category: 'Category',
    price: 'Price',
    sort: 'Sort By',
    allCategories: 'All Categories',
    anyPrice: 'Any Price',
    priceOptions: {
      lowToHigh: 'Price: Low to High',
      highToLow: 'Price: High to Low',
      rating: 'Highest Rating',
      relevance: 'Relevance',
    },
    comparePrices: 'Compare prices across',
    filters: 'Filters',
  },
  product: {
    buyNow: 'Buy Now',
    compare: 'Compare',
    bestPrice: 'Best Price',
    deal: 'Deal',
    freeShipping: 'Free Shipping',
    brand: 'Brand',
  },
  home: {
    searchResults: 'Results for',
    productsFound: 'products found',
    searching: 'Searching across',
    platforms: 'platforms',
    errorFetching: 'Error fetching products',
    errorMessage: 'Please try again later or refine your search query.',
    retry: 'Retry Search',
    searchHeader: 'Search for products',
    searchDescription: 'Enter a product name in the search bar above to compare prices across Amazon Egypt, Noon, Carrefour Egypt, and Talabat.',
    noProducts: 'No products found',
    noProductsMessage: 'We couldn\'t find any products matching your search. Try using different keywords or adjusting your filters.',
    searchTips: 'Search tips',
  },
  newsletter: {
    title: 'Stay updated with the best deals',
    subtitle: 'Subscribe to our newsletter and never miss out on price drops and exclusive offers.',
    placeholder: 'Enter your email address',
    button: 'Subscribe',
    privacy: 'We respect your privacy. Unsubscribe at any time.',
  },
  footer: {
    description: 'Find the best prices across all major Egyptian e-commerce platforms in one place. Compare, track, and save with our smart shopping tools.',
    platforms: 'Supported Platforms',
    quickLinks: 'Quick Links',
    resources: 'Resources',
    copyright: 'All rights reserved.',
  },
};

// Arabic translations
const arTranslations: Translations = {
  header: {
    appName: 'برايس وايز',
    country: 'مصر',
    favorites: 'المفضلة',
    alerts: 'التنبيهات',
    login: 'تسجيل الدخول',
  },
  search: {
    placeholder: 'ابحث عن المنتجات عبر جميع المنصات...',
    button: 'بحث',
    searching: 'جاري البحث',
    pressEnter: 'اضغط Enter للبحث',
  },
  filter: {
    category: 'الفئة',
    price: 'السعر',
    sort: 'ترتيب حسب',
    allCategories: 'جميع الفئات',
    anyPrice: 'أي سعر',
    priceOptions: {
      lowToHigh: 'السعر: من الأقل إلى الأعلى',
      highToLow: 'السعر: من الأعلى إلى الأقل',
      rating: 'أعلى تقييم',
      relevance: 'الصلة',
    },
    comparePrices: 'مقارنة الأسعار عبر',
    filters: 'الفلاتر',
  },
  product: {
    buyNow: 'اشتر الآن',
    compare: 'مقارنة',
    bestPrice: 'أفضل سعر',
    deal: 'عرض',
    freeShipping: 'شحن مجاني',
    brand: 'الماركة',
  },
  home: {
    searchResults: 'نتائج لـ',
    productsFound: 'منتج تم العثور عليه',
    searching: 'البحث عبر',
    platforms: 'منصات',
    errorFetching: 'خطأ في جلب المنتجات',
    errorMessage: 'يرجى المحاولة مرة أخرى لاحقًا أو تحسين استعلام البحث الخاص بك.',
    retry: 'إعادة البحث',
    searchHeader: 'ابحث عن المنتجات',
    searchDescription: 'أدخل اسم المنتج في شريط البحث أعلاه لمقارنة الأسعار عبر أمازون مصر، نون، كارفور مصر، وطلبات.',
    noProducts: 'لم يتم العثور على منتجات',
    noProductsMessage: 'لم نتمكن من العثور على أي منتجات تطابق بحثك. حاول استخدام كلمات رئيسية مختلفة أو ضبط الفلاتر الخاصة بك.',
    searchTips: 'نصائح البحث',
  },
  newsletter: {
    title: 'ابق على اطلاع بأفضل العروض',
    subtitle: 'اشترك في نشرتنا الإخبارية ولا تفوت انخفاضات الأسعار والعروض الحصرية.',
    placeholder: 'أدخل عنوان بريدك الإلكتروني',
    button: 'اشترك',
    privacy: 'نحن نحترم خصوصيتك. يمكنك إلغاء الاشتراك في أي وقت.',
  },
  footer: {
    description: 'ابحث عن أفضل الأسعار عبر جميع منصات التجارة الإلكترونية المصرية الرئيسية في مكان واحد. قارن وتتبع ووفر باستخدام أدوات التسوق الذكية.',
    platforms: 'المنصات المدعومة',
    quickLinks: 'روابط سريعة',
    resources: 'الموارد',
    copyright: 'جميع الحقوق محفوظة.',
  },
};

// Define the context types
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

// Create context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: () => '',
  isRTL: false,
});

// Language Provider Component
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Get language from localStorage or use English as default
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage === 'ar' ? 'ar' : 'en') as Language;
  });

  // Update document direction when language changes
  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem('language', language);
    
    // Update document direction
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Add RTL class to body for global styling if needed
    if (language === 'ar') {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }, [language]);

  // Translation function
  const t = (key: string): string => {
    const translations = language === 'en' ? enTranslations : arTranslations;
    
    // Handle nested keys (e.g., 'header.appName')
    const keys = key.split('.');
    let result: any = translations;
    
    for (const k of keys) {
      if (result[k] === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
      result = result[k];
    }
    
    // For nested objects, return the parent key
    if (typeof result === 'object') {
      return key;
    }
    
    return result as string;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => useContext(LanguageContext);