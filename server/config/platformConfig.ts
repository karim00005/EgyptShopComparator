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
    apiKey: string;
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
      baseUrl: process.env.AMAZON_API_URL || 'https://api.amazon.eg',
      apiKey: process.env.AMAZON_API_KEY || '',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      rateLimit: 5,
      timeout: 5000
    }
  },
  noon: {
    name: 'noon',
    displayName: 'Noon',
    logo: 'https://e7.pngegg.com/pngimages/178/595/png-clipart-noon-hd-logo-thumbnail.png',
    color: '#FEEE00',
    apiConfig: {
      baseUrl: process.env.NOON_API_URL || 'https://api.noon.com/egypt',
      apiKey: process.env.NOON_API_KEY || '',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      rateLimit: 5,
      timeout: 5000
    }
  },
  carrefour: {
    name: 'carrefour',
    displayName: 'Carrefour Egypt',
    logo: 'https://play-lh.googleusercontent.com/Zz_8v5v8tKY4ZyNHwh0gU_P5JrQ018GYmpyui0r3-rC4S8qtd4LtWN0K9Z6KMUb4KA',
    color: '#004E9F',
    apiConfig: {
      baseUrl: process.env.CARREFOUR_API_URL || 'https://api.carrefouregypt.com',
      apiKey: process.env.CARREFOUR_API_KEY || '',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      rateLimit: 5,
      timeout: 5000
    }
  },
  talabat: {
    name: 'talabat',
    displayName: 'Talabat Egypt',
    logo: 'https://play-lh.googleusercontent.com/KhGz6kt8AOi0vQSbH3cCH9jHQVw7oebQ9S9MUuKiLANhkdW6wfiHcl3uGVT4uoJR37wu',
    color: '#FF5A00',
    apiConfig: {
      baseUrl: process.env.TALABAT_API_URL || 'https://api.talabat.com/egypt',
      apiKey: process.env.TALABAT_API_KEY || '',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      rateLimit: 5,
      timeout: 5000
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
