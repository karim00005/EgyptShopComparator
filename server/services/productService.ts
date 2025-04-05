import { Product, SearchParams } from "@shared/schema";
import { AmazonService } from "./amazon";
import { NoonService } from "./noon";
import { CarrefourService } from "./carrefour";
import { TalabatService } from "./talabat";

class ProductService {
  private amazonService: AmazonService;
  private noonService: NoonService;
  private carrefourService: CarrefourService;
  private talabatService: TalabatService;
  
  private productCache: Map<string, Product>;
  private searchResultsCache: Map<string, {timestamp: number, results: Product[]}>;
  private CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  
  constructor() {
    this.amazonService = new AmazonService();
    this.noonService = new NoonService();
    this.carrefourService = new CarrefourService();
    this.talabatService = new TalabatService();
    
    this.productCache = new Map();
    this.searchResultsCache = new Map();
  }
  
  /**
   * Search for products across all platforms
   */
  async searchProducts(params: SearchParams): Promise<{ 
    products: Product[], 
    totalCount: number 
  }> {
    const { query, platforms = ['amazon', 'noon', 'carrefour', 'talabat'], page = 1 } = params;
    const cacheKey = this.generateSearchCacheKey(params);
    
    // Check cache first
    const cachedResults = this.searchResultsCache.get(cacheKey);
    if (cachedResults && (Date.now() - cachedResults.timestamp < this.CACHE_TTL)) {
      console.log(`Using cached results for "${query}"`);
      return { 
        products: this.paginateResults(cachedResults.results, page), 
        totalCount: cachedResults.results.length 
      };
    }
    
    // Execute searches in parallel
    const searchPromises: Promise<Product[]>[] = [];
    
    if (platforms.includes('amazon')) {
      searchPromises.push(this.amazonService.searchProducts(query));
    }
    
    if (platforms.includes('noon')) {
      searchPromises.push(this.noonService.searchProducts(query));
    }
    
    if (platforms.includes('carrefour')) {
      searchPromises.push(this.carrefourService.searchProducts(query));
    }
    
    if (platforms.includes('talabat')) {
      searchPromises.push(this.talabatService.searchProducts(query));
    }
    
    try {
      // Gather all results
      const results = await Promise.all(searchPromises);
      const allProducts = results.flat();
      
      // Filter products with missing or zero prices, or generic titles
      const validProducts = allProducts.filter(product => {
        // Skip products with missing or zero price
        if (!product.price || product.price <= 0) return false;
        
        // Skip products with generic titles (specific to Amazon)
        if (product.platform === 'amazon' && /^Amazon Product \(\d+\)$/.test(product.title)) {
          return false;
        }
        
        return true;
      });
      
      // Process results (filter, sort, etc.)
      const processedProducts = this.processSearchResults(validProducts, params);
      
      // Cache the results
      this.searchResultsCache.set(cacheKey, {
        timestamp: Date.now(),
        results: processedProducts
      });
      
      // Update product cache with individual products
      processedProducts.forEach(product => {
        const productCacheKey = `${product.platform}:${product.id}`;
        this.productCache.set(productCacheKey, product);
      });
      
      // Return paginated results
      return { 
        products: this.paginateResults(processedProducts, page), 
        totalCount: processedProducts.length 
      };
    } catch (error) {
      console.error("Error searching products:", error);
      throw new Error("Failed to search products");
    }
  }
  
  /**
   * Get detailed information about a specific product
   */
  async getProductDetails(platform: string, productId: string): Promise<Product | null> {
    const cacheKey = `${platform}:${productId}`;
    
    // Check cache first
    if (this.productCache.has(cacheKey)) {
      return this.productCache.get(cacheKey) as Product;
    }
    
    // Fetch from appropriate service
    try {
      let product: Product | null = null;
      
      switch (platform) {
        case 'amazon':
          product = await this.amazonService.getProductDetails(productId);
          break;
        case 'noon':
          product = await this.noonService.getProductDetails(productId);
          break;
        case 'carrefour':
          product = await this.carrefourService.getProductDetails(productId);
          break;
        case 'talabat':
          product = await this.talabatService.getProductDetails(productId);
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
      
      if (product) {
        // Cache the product
        this.productCache.set(cacheKey, product);
      }
      
      return product;
    } catch (error) {
      console.error(`Error fetching ${platform} product ${productId}:`, error);
      return null;
    }
  }
  
  /**
   * Compare prices for a product across platforms
   */
  async compareProductPrices(productName: string): Promise<Product[]> {
    // Search across all platforms
    const searchResults = await this.searchProducts({
      query: productName,
      platforms: ['amazon', 'noon', 'carrefour', 'talabat']
    });
    
    // Return sorted by price
    return searchResults.products.sort((a, b) => a.price - b.price);
  }
  
  /**
   * Process search results based on search parameters
   */
  private processSearchResults(products: Product[], params: SearchParams): Product[] {
    let results = [...products];
    
    // Apply category filter
    if (params.category && params.category !== 'all') {
      // This would require category metadata in the products
      // For now, we'll just filter based on title matching the category
      results = results.filter(product => 
        product.title.toLowerCase().includes(params.category!.toLowerCase())
      );
    }
    
    // Apply price range filter
    if (params.priceRange && params.priceRange !== 'all') {
      const [minStr, maxStr] = params.priceRange.split('-');
      
      if (minStr && maxStr) {
        const min = parseFloat(minStr);
        const max = parseFloat(maxStr);
        results = results.filter(product => 
          product.price >= min && product.price <= max
        );
      } else if (minStr && minStr.endsWith('+')) {
        const min = parseFloat(minStr.replace('+', ''));
        results = results.filter(product => product.price >= min);
      }
    }
    
    // Apply sorting
    if (params.sort) {
      switch(params.sort) {
        case 'price_asc':
          results.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          results.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        // Sort by relevance is default or can be implemented with more complex logic
      }
    } else {
      // Default sort by price (lowest first)
      results.sort((a, b) => a.price - b.price);
    }
    
    // Mark best price
    if (results.length > 0) {
      // Find the lowest price for each distinct product name
      const productGroups = new Map<string, Product[]>();
      
      results.forEach(product => {
        // Use normalized product title as group key
        const normalizedTitle = this.normalizeProductTitle(product.title);
        if (!productGroups.has(normalizedTitle)) {
          productGroups.set(normalizedTitle, []);
        }
        productGroups.get(normalizedTitle)!.push(product);
      });
      
      // For each group, find the best price
      productGroups.forEach(group => {
        if (group.length > 0) {
          // Sort by price
          group.sort((a, b) => a.price - b.price);
          // Mark the lowest price as best
          group[0].isBestPrice = true;
        }
      });
    }
    
    return results;
  }
  
  /**
   * Paginate search results
   */
  private paginateResults(results: Product[], page: number, pageSize: number = 20): Product[] {
    const startIndex = (page - 1) * pageSize;
    return results.slice(startIndex, startIndex + pageSize);
  }
  
  /**
   * Generate cache key for a search query
   */
  private generateSearchCacheKey(params: SearchParams): string {
    const { query, category = 'all', priceRange = 'all', sort = 'price_asc', platforms } = params;
    const platformsStr = platforms ? platforms.sort().join(',') : 'all';
    return `${query}:${category}:${priceRange}:${sort}:${platformsStr}`;
  }
  
  /**
   * Normalize product title for comparison
   */
  private normalizeProductTitle(title: string): string {
    // Remove special characters, extra spaces, and convert to lowercase
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export const productService = new ProductService();
