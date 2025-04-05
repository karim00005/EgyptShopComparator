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
      
      // Make the request to Carrefour Egypt
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: this.timeout
      });
      
      // If we got a response, parse it
      if (response.status === 200) {
        return this.parseSearchResults(response.data, query);
      }
      
      return [];
    } catch (error) {
      console.error('Error searching Carrefour Egypt:', error);
      return this.generateMockProducts(query, 5); // Fallback to mock data on error
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
      
      // Make the request to Carrefour Egypt
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: this.timeout
      });
      
      // If we got a response, parse it
      if (response.status === 200) {
        return this.parseProductDetails(response.data, productCode);
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching Carrefour Egypt product ${productId}:`, error);
      return this.generateMockProduct(productId); // Fallback to mock data on error
    }
  }
  
  /**
   * Parse Carrefour search results page
   */
  private parseSearchResults(html: string, query: string): Product[] {
    try {
      const $ = cheerio.load(html);
      const products: Product[] = [];
      
      // Carrefour search results are in product cards
      $('.product-card').each((i, element) => {
        if (products.length >= 20) return; // Limit to 20 products
        
        try {
          // Extract product details
          const productUrl = $(element).find('.product-name a').attr('href') || '';
          if (!productUrl) return;
          
          const productId = productUrl.split('/').pop() || '';
          
          // Title
          const title = $(element).find('.product-name a').text().trim();
          
          // URL
          const url = this.baseUrl + productUrl;
          
          // Price
          let price = 0;
          const priceText = $(element).find('.price-wrapper .price').text().trim();
          if (priceText) {
            price = parseFloat(priceText.replace(/[^\d.]/g, ''));
          }
          
          // Original price
          let originalPrice: number | undefined;
          const oldPriceText = $(element).find('.price-wrapper .old-price').text().trim();
          if (oldPriceText) {
            originalPrice = parseFloat(oldPriceText.replace(/[^\d.]/g, ''));
          }
          
          // Discount
          let discount: number | undefined;
          if (originalPrice && price && originalPrice > price) {
            discount = Math.round(((originalPrice - price) / originalPrice) * 100);
          } else {
            const discountText = $(element).find('.discount-percent').text().trim();
            if (discountText && discountText.includes('%')) {
              discount = parseInt(discountText.replace(/[^\d]/g, ''), 10);
            }
          }
          
          // Image
          const image = $(element).find('.product-image img').attr('src') || '';
          
          // Check for promotional flags
          const isPromotional = $(element).find('.discount-percent, .promotion-label').length > 0;
          
          // Check for free delivery
          const isFreeDelivery = $(element).find('.free-delivery-label').length > 0;
          
          // Brand, if available
          const brand = $(element).find('.product-brand').text().trim() || 'Carrefour';
          
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
      
      return products;
    } catch (error) {
      console.error('Error parsing Carrefour search results:', error);
      return this.generateMockProducts(query, 5); // Fallback to mock data on parsing error
    }
  }
  
  /**
   * Parse product details page
   */
  private parseProductDetails(html: string, productCode: string): Product | null {
    try {
      const $ = cheerio.load(html);
      
      // Extract product title
      const title = $('.product-name').text().trim();
      
      // Extract current price
      let price = 0;
      const priceText = $('.product-price .price').text().trim();
      if (priceText) {
        price = parseFloat(priceText.replace(/[^\d.]/g, ''));
      }
      
      // Extract original price if discounted
      let originalPrice: number | undefined;
      const oldPriceText = $('.product-price .old-price').text().trim();
      if (oldPriceText) {
        originalPrice = parseFloat(oldPriceText.replace(/[^\d.]/g, ''));
      }
      
      // Calculate discount
      let discount: number | undefined;
      if (originalPrice && price && originalPrice > price) {
        discount = Math.round(((originalPrice - price) / originalPrice) * 100);
      } else {
        const discountText = $('.discount-percent').text().trim();
        if (discountText && discountText.includes('%')) {
          discount = parseInt(discountText.replace(/[^\d]/g, ''), 10);
        }
      }
      
      // Extract product image
      const image = $('.product-gallery img').first().attr('src') || '';
      
      // Extract product description
      const description = $('.product-description').text().trim();
      
      // Check for free delivery
      const deliveryText = $('.delivery-info').text().trim();
      const isFreeDelivery = deliveryText.includes('Free') || deliveryText.includes('مجاني');
      
      // Extract brand
      const brand = $('.product-brand').text().trim() || 'Carrefour';
      
      // Extract specifications
      const specs: { key: string, value: string }[] = [];
      $('.product-specifications tr').each((i, row) => {
        const key = $(row).find('th').text().trim();
        const value = $(row).find('td').text().trim();
        if (key && value) {
          specs.push({ key, value });
        }
      });
      
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
    } catch (error) {
      console.error(`Error parsing Carrefour product details for ${productCode}:`, error);
      return this.generateMockProduct(productCode); // Fallback to mock data on parsing error
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
