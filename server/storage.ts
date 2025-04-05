import { 
  users, type User, type InsertUser,
  favoriteProducts, type FavoriteProduct, type InsertFavoriteProduct,
  priceAlerts, type PriceAlert, type InsertPriceAlert,
  platformConfigs, type PlatformConfig, type InsertPlatformConfig,
  Product
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Favorite products operations
  getFavoriteProducts(userId: number): Promise<FavoriteProduct[]>;
  addFavoriteProduct(favoriteProduct: InsertFavoriteProduct): Promise<FavoriteProduct>;
  removeFavoriteProduct(userId: number, productId: string, platform: string): Promise<void>;
  
  // Price alerts operations
  getPriceAlerts(userId: number): Promise<PriceAlert[]>;
  addPriceAlert(priceAlert: InsertPriceAlert): Promise<PriceAlert>;
  updatePriceAlert(id: number, updates: Partial<PriceAlert>): Promise<PriceAlert>;
  removePriceAlert(id: number): Promise<void>;
  
  // Platform configs operations
  getPlatformConfigs(): Promise<PlatformConfig[]>;
  getPlatformConfig(platform: string): Promise<PlatformConfig | undefined>;
  addPlatformConfig(config: InsertPlatformConfig): Promise<PlatformConfig>;
  updatePlatformConfig(platform: string, updates: Partial<PlatformConfig>): Promise<PlatformConfig>;
}

export class MemStorage implements IStorage {
  private usersStore: Map<number, User>;
  private favoriteProductsStore: Map<number, FavoriteProduct>;
  private priceAlertsStore: Map<number, PriceAlert>;
  private platformConfigsStore: Map<string, PlatformConfig>;
  
  private userIdCounter: number;
  private favoriteProductIdCounter: number;
  private priceAlertIdCounter: number;
  private platformConfigIdCounter: number;

  constructor() {
    this.usersStore = new Map();
    this.favoriteProductsStore = new Map();
    this.priceAlertsStore = new Map();
    this.platformConfigsStore = new Map();
    
    this.userIdCounter = 1;
    this.favoriteProductIdCounter = 1;
    this.priceAlertIdCounter = 1;
    this.platformConfigIdCounter = 1;
    
    // Initialize with default platform configs
    this.initDefaultPlatformConfigs();
  }

  private initDefaultPlatformConfigs() {
    const platforms = ['amazon', 'noon', 'carrefour', 'talabat'];
    
    platforms.forEach(platform => {
      const config: InsertPlatformConfig = {
        platform,
        config: {
          baseUrl: '',
          apiKey: '',
          headers: {},
          rateLimit: 5,
          timeout: 5000
        },
        isActive: true
      };
      
      this.addPlatformConfig(config);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersStore.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersStore.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersStore.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { id, ...user };
    this.usersStore.set(id, newUser);
    return newUser;
  }

  // Favorite products operations
  async getFavoriteProducts(userId: number): Promise<FavoriteProduct[]> {
    return Array.from(this.favoriteProductsStore.values()).filter(
      (favorite) => favorite.userId === userId,
    );
  }

  async addFavoriteProduct(favoriteProduct: InsertFavoriteProduct): Promise<FavoriteProduct> {
    const id = this.favoriteProductIdCounter++;
    const newFavorite: FavoriteProduct = { 
      id, 
      ...favoriteProduct, 
      dateAdded: new Date() 
    };
    this.favoriteProductsStore.set(id, newFavorite);
    return newFavorite;
  }

  async removeFavoriteProduct(userId: number, productId: string, platform: string): Promise<void> {
    const favorites = Array.from(this.favoriteProductsStore.entries());
    
    for (const [key, favorite] of favorites) {
      if (favorite.userId === userId && favorite.productId === productId && favorite.platform === platform) {
        this.favoriteProductsStore.delete(key);
        break;
      }
    }
  }

  // Price alerts operations
  async getPriceAlerts(userId: number): Promise<PriceAlert[]> {
    return Array.from(this.priceAlertsStore.values()).filter(
      (alert) => alert.userId === userId,
    );
  }

  async addPriceAlert(priceAlert: InsertPriceAlert): Promise<PriceAlert> {
    const id = this.priceAlertIdCounter++;
    const newAlert: PriceAlert = { 
      id, 
      ...priceAlert, 
      isActive: true,
      dateCreated: new Date() 
    };
    this.priceAlertsStore.set(id, newAlert);
    return newAlert;
  }

  async updatePriceAlert(id: number, updates: Partial<PriceAlert>): Promise<PriceAlert> {
    const alert = this.priceAlertsStore.get(id);
    if (!alert) {
      throw new Error(`Price alert with ID ${id} not found`);
    }
    
    const updatedAlert = { ...alert, ...updates };
    this.priceAlertsStore.set(id, updatedAlert);
    return updatedAlert;
  }

  async removePriceAlert(id: number): Promise<void> {
    this.priceAlertsStore.delete(id);
  }

  // Platform configs operations
  async getPlatformConfigs(): Promise<PlatformConfig[]> {
    return Array.from(this.platformConfigsStore.values());
  }

  async getPlatformConfig(platform: string): Promise<PlatformConfig | undefined> {
    return this.platformConfigsStore.get(platform);
  }

  async addPlatformConfig(config: InsertPlatformConfig): Promise<PlatformConfig> {
    const id = this.platformConfigIdCounter++;
    const newConfig: PlatformConfig = { id, ...config };
    this.platformConfigsStore.set(config.platform, newConfig);
    return newConfig;
  }

  async updatePlatformConfig(platform: string, updates: Partial<PlatformConfig>): Promise<PlatformConfig> {
    const config = this.platformConfigsStore.get(platform);
    if (!config) {
      throw new Error(`Platform config for ${platform} not found`);
    }
    
    const updatedConfig = { ...config, ...updates };
    
    // Handle nested config object update
    if (updates.config) {
      updatedConfig.config = {
        ...config.config,
        ...updates.config
      };
    }
    
    this.platformConfigsStore.set(platform, updatedConfig);
    return updatedConfig;
  }
}

export const storage = new MemStorage();
