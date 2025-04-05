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
    
    console.log(`Searching for: "${query}"`);
    
    // Set a timeout for each promise to avoid hanging requests
    const SEARCH_TIMEOUT = 15000; // 15 seconds timeout
    
    // Function to create a promise with timeout
    const createTimeoutPromise = <T>(promise: Promise<T>, timeoutMs: number, platformName: string): Promise<T> => {
      let timeoutId: NodeJS.Timeout;
      
      const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${platformName} search timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      });
      
      return Promise.race([
        promise.then(result => {
          clearTimeout(timeoutId);
          return result;
        }),
        timeoutPromise
      ]);
    };
    
    // Execute searches in parallel with better error handling and timeouts
    const platformPromises: { platform: string; promise: Promise<Product[]> }[] = [];
    
    if (platforms.includes('amazon')) {
      platformPromises.push({
        platform: 'amazon', 
        promise: createTimeoutPromise(
          this.amazonService.searchProducts(query), 
          SEARCH_TIMEOUT, 
          'Amazon'
        ).catch(error => {
          console.error(`Amazon search error: ${error.message}`);
          return [];
        })
      });
    }
    
    if (platforms.includes('noon')) {
      platformPromises.push({
        platform: 'noon',
        promise: createTimeoutPromise(
          this.noonService.searchProducts(query),
          SEARCH_TIMEOUT, 
          'Noon'
        ).catch(error => {
          console.error(`Noon search error: ${error.message}`);
          return [];
        })
      });
    }
    
    if (platforms.includes('carrefour')) {
      platformPromises.push({
        platform: 'carrefour',
        promise: createTimeoutPromise(
          this.carrefourService.searchProducts(query),
          SEARCH_TIMEOUT, 
          'Carrefour'
        ).catch(error => {
          console.error(`Carrefour search error: ${error.message}`);
          return [];
        })
      });
    }
    
    if (platforms.includes('talabat')) {
      platformPromises.push({
        platform: 'talabat',
        promise: createTimeoutPromise(
          this.talabatService.searchProducts(query),
          SEARCH_TIMEOUT, 
          'Talabat'
        ).catch(error => {
          console.error(`Talabat search error: ${error.message}`);
          return [];
        })
      });
    }
    
    try {
      // Gather all results with logging
      const results = await Promise.all(platformPromises.map(p => p.promise));
      
      // Log results by platform
      platformPromises.forEach((platformData, index) => {
        const platformResults = results[index];
        console.log(`${platformData.platform} returned ${platformResults.length} products`);
      });
      
      const allProducts = results.flat();
      
      // Validate and fix product data
      const validProducts = allProducts.filter(product => {
        // Skip products with missing or zero price
        if (!product.price || product.price <= 0) return false;
        
        // Skip products with generic titles (specific to Amazon)
        if (product.platform === 'amazon' && /^Amazon Product \(\d+\)$/.test(product.title)) {
          return false;
        }
        
        // Ensure URL is set properly
        if (!product.url) {
          return false;
        }
        
        return true;
      }).map(product => {
        // Ensure URLs are absolute and properly formed
        if (product.url && !product.url.startsWith('http')) {
          switch (product.platform) {
            case 'amazon':
              product.url = `https://www.amazon.eg${product.url.startsWith('/') ? '' : '/'}${product.url}`;
              break;
            case 'noon':
              product.url = `https://www.noon.com${product.url.startsWith('/') ? '' : '/'}${product.url}`;
              break;
            case 'carrefour':
              product.url = `https://www.carrefouregypt.com${product.url.startsWith('/') ? '' : '/'}${product.url}`;
              break;
            case 'talabat':
              product.url = `https://www.talabat.com${product.url.startsWith('/') ? '' : '/'}${product.url}`;
              break;
          }
        }
        
        // Add UTM tracking for analytics
        if (product.url) {
          const utmParams = `utm_source=pricena&utm_medium=comparison&utm_campaign=product`;
          product.url = product.url.includes('?') 
            ? `${product.url}&${utmParams}` 
            : `${product.url}?${utmParams}`;
        }
        
        // Ensure images are absolute URLs
        if (product.image && !product.image.startsWith('http')) {
          switch (product.platform) {
            case 'amazon':
              product.image = `https://www.amazon.eg${product.image.startsWith('/') ? '' : '/'}${product.image}`;
              break;
            case 'noon':
              product.image = `https://f.nooncdn.com${product.image.startsWith('/') ? '' : '/'}${product.image}`;
              break;
            case 'carrefour':
              product.image = `https://www.carrefouregypt.com${product.image.startsWith('/') ? '' : '/'}${product.image}`;
              break;
            case 'talabat':
              product.image = `https://images.deliveryhero.io${product.image.startsWith('/') ? '' : '/'}${product.image}`;
              break;
          }
        }
        
        return product;
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
      
      // Set timeout for operation
      const DETAIL_TIMEOUT = 10000; // 10 seconds
      
      const fetchWithTimeout = async () => {
        return new Promise<Product | null>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error(`${platform} product detail lookup timed out after ${DETAIL_TIMEOUT}ms`));
          }, DETAIL_TIMEOUT);
          
          let promise: Promise<Product | null>;
          
          switch (platform) {
            case 'amazon':
              promise = this.amazonService.getProductDetails(productId);
              break;
            case 'noon':
              promise = this.noonService.getProductDetails(productId);
              break;
            case 'carrefour':
              promise = this.carrefourService.getProductDetails(productId);
              break;
            case 'talabat':
              promise = this.talabatService.getProductDetails(productId);
              break;
            default:
              clearTimeout(timeoutId);
              reject(new Error(`Unsupported platform: ${platform}`));
              return;
          }
          
          promise.then(result => {
            clearTimeout(timeoutId);
            resolve(result);
          }).catch(error => {
            clearTimeout(timeoutId);
            reject(error);
          });
        });
      };
      
      try {
        product = await fetchWithTimeout();
      } catch (timeoutError) {
        console.error(timeoutError);
        return null;
      }
      
      if (product) {
        // Ensure URLs are absolute and properly formed
        if (product.url && !product.url.startsWith('http')) {
          switch (product.platform) {
            case 'amazon':
              product.url = `https://www.amazon.eg${product.url.startsWith('/') ? '' : '/'}${product.url}`;
              break;
            case 'noon':
              product.url = `https://www.noon.com${product.url.startsWith('/') ? '' : '/'}${product.url}`;
              break;
            case 'carrefour':
              product.url = `https://www.carrefouregypt.com${product.url.startsWith('/') ? '' : '/'}${product.url}`;
              break;
            case 'talabat':
              product.url = `https://www.talabat.com${product.url.startsWith('/') ? '' : '/'}${product.url}`;
              break;
          }
        }
        
        // Add UTM tracking
        if (product.url) {
          const utmParams = `utm_source=pricena&utm_medium=comparison&utm_campaign=product_details`;
          product.url = product.url.includes('?') 
            ? `${product.url}&${utmParams}` 
            : `${product.url}?${utmParams}`;
        }
        
        // Ensure images are absolute URLs
        if (product.image && !product.image.startsWith('http')) {
          switch (product.platform) {
            case 'amazon':
              product.image = `https://www.amazon.eg${product.image.startsWith('/') ? '' : '/'}${product.image}`;
              break;
            case 'noon':
              product.image = `https://f.nooncdn.com${product.image.startsWith('/') ? '' : '/'}${product.image}`;
              break;
            case 'carrefour':
              product.image = `https://www.carrefouregypt.com${product.image.startsWith('/') ? '' : '/'}${product.image}`;
              break;
            case 'talabat':
              product.image = `https://images.deliveryhero.io${product.image.startsWith('/') ? '' : '/'}${product.image}`;
              break;
          }
        }
        
        // Cache the product with fixed URLs
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
