import axios from 'axios';
import * as cheerio from 'cheerio';
import { Product } from '@shared/schema';
import { getPlatformConfig } from '../config/platformConfig';

export class CarrefourService {
  private baseUrl: string;
  private searchUrl: string;
  private productUrl: string;
  private headers: Record<string, string>;
  private timeout: number;
  
  constructor() {
    const config = getPlatformConfig('carrefour');
    
    if (!config) {
      throw new Error('Carrefour platform configuration not found');
    }
    
    this.baseUrl = config.apiConfig.baseUrl;
    this.searchUrl = config.apiConfig.searchUrl;
    this.productUrl = config.apiConfig.productUrl;
    this.headers = config.apiConfig.headers;
    this.timeout = config.apiConfig.timeout;
  }
  
  /**
   * Search for products on Carrefour Egypt
   */
  async searchProducts(query: string): Promise<Product[]> {
    try {
      console.log(`Searching Carrefour Egypt for: ${query}`);
      
      // Use fallback if needed for development/testing
      if (process.env.USE_MOCK_DATA === 'true') {
        return this.generateMockProducts(query, 8);
      }
      
      // Encode query for Arabic support
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.searchUrl}?keyword=${encodedQuery}`;
      
      console.log(`Making request to Carrefour URL: ${url}`);
      console.log(`With headers:`, JSON.stringify(this.headers, null, 2));
      
      // Make the request to Carrefour Egypt
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: this.timeout,
        maxContentLength: 10 * 1024 * 1024, // 10MB max response size
        validateStatus: (status) => status >= 200 && status < 500 // Accept all non-server error responses for debugging
      });
      
      // Debug response status
      console.log(`Carrefour response status: ${response.status}`);
      console.log(`Carrefour response size: ${response.data ? (response.data.length || 0) : 0} characters`);
      
      // If we got a response, parse it
      if (response.status === 200) {
        // Look for product grid in response
        if (response.data && response.data.includes('plp-products-grid')) {
          console.log('Product grid found in Carrefour response');
        } else {
          console.log('Product grid NOT found in Carrefour response');
        }
        
        return this.parseSearchResults(response.data, query);
      } else {
        console.log(`Carrefour returned non-200 status code: ${response.status}`);
      }
      
      return [];
    } catch (error: any) {
      console.error('Error searching Carrefour Egypt:', error);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response headers:`, error.response.headers);
      }
      return []; // Return empty array instead of mock data
    }
  }
  
  /**
   * Get detailed product information
   */
  async getProductDetails(productId: string): Promise<Product | null> {
    try {
      console.log(`Fetching Carrefour Egypt product details for: ${productId}`);
      
      // Use fallback if needed for development/testing
      if (process.env.USE_MOCK_DATA === 'true') {
        return this.generateMockProduct(productId);
      }
      
      // Extract the product code if it's a full URL
      const productCode = productId.includes('/product/') ? 
        productId.split('/product/')[1].split('/')[0] : 
        productId;
      
      const url = `${this.productUrl}/${productCode}`;
      
      console.log(`Making request to Carrefour product URL: ${url}`);
      console.log(`With headers:`, JSON.stringify(this.headers, null, 2));
      
      // Make the request to Carrefour Egypt
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: this.timeout,
        maxContentLength: 10 * 1024 * 1024, // 10MB max response size
        validateStatus: (status) => status >= 200 && status < 500 // Accept all non-server error responses for debugging
      });
      
      // Debug response status
      console.log(`Carrefour product response status: ${response.status}`);
      console.log(`Carrefour product response size: ${response.data ? (response.data.length || 0) : 0} characters`);
      
      // If we got a response, parse it
      if (response.status === 200) {
        // Check if response contains product title
        if (response.data && 
           (response.data.includes('pdp-product-title') || 
            response.data.includes('product-title'))) {
          console.log('Product title found in Carrefour response');
        } else {
          console.log('Product title NOT found in Carrefour response');
        }
        
        return this.parseProductDetails(response.data, productCode);
      } else {
        console.log(`Carrefour returned non-200 status code: ${response.status}`);
      }
      
      return null;
    } catch (error: any) {
      console.error(`Error fetching Carrefour Egypt product ${productId}:`, error);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response headers:`, error.response.headers);
      }
      return null; // Return null instead of mock data
    }
  }
  
  /**
   * Parse Carrefour search results page
   */
  private parseSearchResults(html: string, query: string): Product[] {
    try {
      const $ = cheerio.load(html);
      const products: Product[] = [];
      
      console.log("Parsing Carrefour results...");
      
      // Carrefour search results are in product cards with ul/li structure
      // Updated selectors based on actual HTML structure
      $('ul[data-testid="plp-products-grid"] li').each((i, element) => {
        if (products.length >= 20) return; // Limit to 20 products
        
        try {
          // Extract product details
          const productLink = $(element).find('a[data-testid="product-tile"]');
          const productUrl = productLink.attr('href') || '';
          if (!productUrl) return;
          
          // Extract product ID from URL
          const productId = productUrl.split('/').pop() || '';
          
          // Title
          const title = $(element).find('h3[data-testid="product-name"]').text().trim();
          if (!title) return;
          
          // URL - ensure it starts with domain if it's a relative URL
          const url = productUrl.startsWith('http') ? productUrl : this.baseUrl + productUrl;
          
          // Price
          let price = 0;
          const priceElement = $(element).find('span[data-testid="current-price"]');
          if (priceElement) {
            const priceText = priceElement.text().trim();
            if (priceText) {
              // Extract only numbers and decimal point
              price = parseFloat(priceText.replace(/[^\d.]/g, ''));
            }
          }
          
          // Original price
          let originalPrice: number | undefined;
          const oldPriceElement = $(element).find('span[data-testid="old-price"]');
          if (oldPriceElement.length > 0) {
            const oldPriceText = oldPriceElement.text().trim();
            if (oldPriceText) {
              originalPrice = parseFloat(oldPriceText.replace(/[^\d.]/g, ''));
            }
          }
          
          // Discount
          let discount: number | undefined;
          if (originalPrice && price && originalPrice > price) {
            discount = Math.round(((originalPrice - price) / originalPrice) * 100);
          } else {
            const discountElement = $(element).find('[data-testid="product-discount"]');
            if (discountElement.length > 0) {
              const discountText = discountElement.text().trim();
              if (discountText && discountText.includes('%')) {
                discount = parseInt(discountText.replace(/[^\d]/g, ''), 10);
              }
            }
          }
          
          // Image
          const imageElement = $(element).find('img');
          const image = imageElement.attr('src') || '';
          
          // Check for promotional flags
          const isPromotional = discount !== undefined && discount > 0;
          
          // Check for free delivery - look for terms indicating free delivery
          const isFreeDelivery = $(element).text().toLowerCase().includes('توصيل مجاني') || 
                                 $(element).text().toLowerCase().includes('free delivery');
          
          // Brand - Carrefour by default, but try to extract from various elements
          let brand = 'Carrefour';
          const brandElement = $(element).find('[data-testid="product-brand"]');
          if (brandElement.length > 0) {
            const brandText = brandElement.text().trim();
            if (brandText) {
              brand = brandText;
            }
          }
          
          console.log(`Found Carrefour product: ${title} at ${price} EGP`);
          
          products.push({
            id: `carrefour-${productId}`,
            title,
            price,
            originalPrice,
            discount,
            image,
            url,
            platform: 'carrefour',
            isFreeDelivery,
            isPromotional,
            brand,
            isBestPrice: false // Will be calculated later
          });
        } catch (e) {
          console.error('Error parsing Carrefour product:', e);
        }
      });
      
      console.log(`Found ${products.length} Carrefour products`);
      return products;
    } catch (error: any) {
      console.error('Error parsing Carrefour search results:', error);
      return []; // Return empty array instead of mock data
    }
  }
  
  /**
   * Parse product details page
   */
  private parseProductDetails(html: string, productCode: string): Product | null {
    try {
      const $ = cheerio.load(html);
      console.log("Parsing Carrefour product details...");
      
      // Extract product title using updated selectors
      const title = $('h1[data-testid="pdp-product-title"]').text().trim() || 
                    $('h1.product-title').text().trim();
      
      if (!title) {
        console.log("Could not find product title");
        return null;
      }
      
      // Extract current price
      let price = 0;
      const priceElement = $('span[data-testid="current-price"]');
      if (priceElement.length > 0) {
        const priceText = priceElement.text().trim();
        if (priceText) {
          price = parseFloat(priceText.replace(/[^\d.]/g, ''));
        }
      }
      
      // Extract original price if discounted
      let originalPrice: number | undefined;
      const oldPriceElement = $('span[data-testid="old-price"]');
      if (oldPriceElement.length > 0) {
        const oldPriceText = oldPriceElement.text().trim();
        if (oldPriceText) {
          originalPrice = parseFloat(oldPriceText.replace(/[^\d.]/g, ''));
        }
      }
      
      // Calculate discount
      let discount: number | undefined;
      if (originalPrice && price && originalPrice > price) {
        discount = Math.round(((originalPrice - price) / originalPrice) * 100);
      } else {
        const discountElement = $('[data-testid="product-discount"]');
        if (discountElement.length > 0) {
          const discountText = discountElement.text().trim();
          if (discountText && discountText.includes('%')) {
            discount = parseInt(discountText.replace(/[^\d]/g, ''), 10);
          }
        }
      }
      
      // Extract product image
      const image = $('img[data-testid="product-image"]').attr('src') || 
                   $('img.carousel-image').attr('src') || '';
      
      // Extract product description
      const description = $('[data-testid="product-details-description"]').text().trim() || 
                          $('.product-description').text().trim();
      
      // Check for free delivery
      const pageText = $('body').text().toLowerCase();
      const isFreeDelivery = pageText.includes('توصيل مجاني') || 
                             pageText.includes('free delivery');
      
      // Extract brand
      let brand = 'Carrefour';
      const brandElement = $('[data-testid="product-brand"]');
      if (brandElement.length > 0) {
        const brandText = brandElement.text().trim();
        if (brandText) {
          brand = brandText;
        }
      }
      
      // Extract specifications
      const specs: { key: string, value: string }[] = [];
      $('[data-testid="product-attributes-table"] tr, .product-specifications tr, .product-attributes tr').each((i, row) => {
        const key = $(row).find('th, td:first-child').text().trim();
        const value = $(row).find('td:last-child').text().trim();
        if (key && value) {
          specs.push({ key, value });
        }
      });
      
      console.log(`Found Carrefour product details: ${title} at ${price} EGP`);
      
      return {
        id: `carrefour-${productCode}`,
        title,
        price,
        originalPrice,
        discount,
        image,
        url: `${this.baseUrl}/mafegy/ar/v4/product/${productCode}`,
        platform: 'carrefour',
        description,
        isFreeDelivery,
        isPromotional: discount !== undefined && discount > 0,
        brand,
        specs,
        isBestPrice: false
      };
    } catch (error: any) {
      console.error(`Error parsing Carrefour product details for ${productCode}:`, error);
      return null; // Return null instead of mock data
    }
  }
  
  /**
   * Helper method to generate mock products for testing/fallback
   */
  private generateMockProducts(query: string, count: number): Product[] {
    const products: Product[] = [];
    
    for (let i = 0; i < count; i++) {
      const basePrice = 95 + Math.floor(Math.random() * 210);
      const discountPercent = Math.floor(Math.random() * 25);
      const originalPrice = basePrice * (100 + discountPercent) / 100;
      
      const product: Product = {
        id: `carrefour-${Date.now()}-${i}`,
        title: `${query} - Carrefour ${i + 1}`,
        price: basePrice,
        originalPrice: originalPrice,
        discount: discountPercent,
        image: `https://via.placeholder.com/300x300?text=Carrefour+${query.replace(/\s+/g, '+')}`,
        url: `https://www.carrefouregypt.com/mafegy/en/product-${i}${Date.now().toString().substring(0, 6)}`,
        platform: 'carrefour',
        rating: 3.0 + Math.random() * 2.0,
        reviewCount: Math.floor(Math.random() * 80),
        description: `This is a ${query} product from Carrefour Egypt. High quality and affordable.`,
        isPromotional: Math.random() > 0.6,
        isFreeDelivery: Math.random() > 0.7,
        brand: 'Carrefour',
        specs: [
          { key: 'Weight', value: '1kg' },
          { key: 'Dimensions', value: '10x10x10 cm' }
        ]
      };
      
      products.push(product);
    }
    
    return products;
  }
  
  /**
   * Generate a mock product for a specific ID (fallback)
   */
  private generateMockProduct(productId: string): Product {
    const basePrice = 95 + Math.floor(Math.random() * 210);
    const discountPercent = Math.floor(Math.random() * 25);
    const originalPrice = basePrice * (100 + discountPercent) / 100;
    
    return {
      id: `carrefour-${productId}`,
      title: `Carrefour Product ${productId.substring(0, 8)}`,
      price: basePrice,
      originalPrice: originalPrice,
      discount: discountPercent,
      image: `https://via.placeholder.com/500x500?text=Carrefour+Product`,
      url: `https://www.carrefouregypt.com/mafegy/ar/product/${productId}`,
      platform: 'carrefour',
      rating: 3.0 + Math.random() * 2.0,
      reviewCount: Math.floor(Math.random() * 80),
      description: 'Detailed product description would go here. This includes all the specifications and features of the product.',
      isPromotional: Math.random() > 0.6,
      isFreeDelivery: Math.random() > 0.7,
      brand: 'Carrefour',
      specs: [
        { key: 'Weight', value: '1kg' },
        { key: 'Dimensions', value: '10x10x10 cm' },
        { key: 'Color', value: 'Red' },
        { key: 'Material', value: 'Metal' }
      ]
    };
  }
}
