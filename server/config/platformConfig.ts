/**
 * Configuration for e-commerce platform APIs
 */
type PlatformConfig = {
  name: string;
  displayName: string;
  logo: string;
  color: string;
  apiConfig: {
    baseUrl: string;
    searchUrl: string;
    productUrl: string;
    headers: Record<string, string>;
    rateLimit: number; // requests per second
    timeout: number; // ms
  };
};

/**
 * Default configurations for supported platforms
 */
export const platformConfigs: Record<string, PlatformConfig> = {
  amazon: {
    name: 'amazon',
    displayName: 'Amazon Egypt',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/320px-Amazon_logo.svg.png',
    color: '#FF9900',
    apiConfig: {
      baseUrl: 'https://www.amazon.eg',
      searchUrl: 'https://www.amazon.eg/s',
      productUrl: 'https://www.amazon.eg/dp',
      headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9,ar;q=0.8',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"'
      },
      rateLimit: 1,
      timeout: 10000
    }
  },
  noon: {
    name: 'noon',
    displayName: 'Noon',
    logo: 'https://e7.pngegg.com/pngimages/178/595/png-clipart-noon-hd-logo-thumbnail.png',
    color: '#FEEE00',
    apiConfig: {
      baseUrl: 'https://www.noon.com',
      searchUrl: 'https://www.noon.com/egypt-ar/search',
      productUrl: 'https://www.noon.com/egypt-ar/product',
      headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9,ar;q=0.8',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"'
      },
      rateLimit: 1,
      timeout: 10000
    }
  },
  carrefour: {
    name: 'carrefour',
    displayName: 'Carrefour Egypt',
    logo: 'https://play-lh.googleusercontent.com/Zz_8v5v8tKY4ZyNHwh0gU_P5JrQ018GYmpyui0r3-rC4S8qtd4LtWN0K9Z6KMUb4KA',
    color: '#004E9F',
    apiConfig: {
      baseUrl: 'https://www.carrefouregypt.com',
      searchUrl: 'https://www.carrefouregypt.com/mafegy/ar/v4/search',
      productUrl: 'https://www.carrefouregypt.com/mafegy/ar/v4/product',
      headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9,ar;q=0.8',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"'
      },
      rateLimit: 1,
      timeout: 10000
    }
  },
  talabat: {
    name: 'talabat',
    displayName: 'Talabat Egypt',
    logo: 'https://play-lh.googleusercontent.com/KhGz6kt8AOi0vQSbH3cCH9jHQVw7oebQ9S9MUuKiLANhkdW6wfiHcl3uGVT4uoJR37wu',
    color: '#FF5A00',
    apiConfig: {
      baseUrl: 'https://www.talabat.com',
      searchUrl: 'https://www.talabat.com/nextApi/groceries/stores/0bbe2d06-bbf4-4992-b74f-d19304dd4fc8/products',
      productUrl: 'https://www.talabat.com/egypt/grocery',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'ar-KW',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'appbrand': '1',
        'sourceapp': 'web',
        'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'x-device-source': '0'
      },
      rateLimit: 1,
      timeout: 10000
    }
  },
  jumia: {
    name: 'jumia',
    displayName: 'Jumia Egypt',
    logo: 'https://eg.jumia.is/cms/Icons/jumia-logo-v2.png',
    color: '#F68B1E',
    apiConfig: {
      baseUrl: 'https://www.jumia.com.eg',
      searchUrl: 'https://www.jumia.com.eg/ar/catalog',
      productUrl: 'https://www.jumia.com.eg/ar/catalog/productinfo',
      headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9,ar;q=0.8',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"'
      },
      rateLimit: 1,
      timeout: 10000
    }
  }
};

/**
 * Get a platform configuration by name
 */
export function getPlatformConfig(platform: string): PlatformConfig | undefined {
  return platformConfigs[platform.toLowerCase()];
}

/**
 * Get all platform configurations
 */
export function getAllPlatformConfigs(): PlatformConfig[] {
  return Object.values(platformConfigs);
}
