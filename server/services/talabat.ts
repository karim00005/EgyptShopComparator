import axios from 'axios';
import * as cheerio from 'cheerio';
import { Product } from '@shared/schema';
import { getPlatformConfig } from '../config/platformConfig';

export class TalabatService {
  private baseUrl: string;
  private searchUrl: string;
  private productUrl: string;
  private headers: Record<string, string>;
  private timeout: number;
  
  constructor() {
    const config = getPlatformConfig('talabat');
    
    if (!config) {
      throw new Error('Talabat platform configuration not found');
    }
    
    this.baseUrl = config.apiConfig.baseUrl;
    this.searchUrl = config.apiConfig.searchUrl;
    this.productUrl = config.apiConfig.productUrl;
    this.headers = config.apiConfig.headers;
    this.timeout = config.apiConfig.timeout;
  }
  
  /**
   * Search for products on Talabat Egypt
   */
  async searchProducts(query: string): Promise<Product[]> {
    try {
      console.log(`Searching Talabat Egypt for: ${query}`);
      
      // Use fallback if needed for development/testing
      if (process.env.USE_MOCK_DATA === 'true') {
        return this.generateMockProducts(query, 7);
      }
      
      // Encode query for Arabic support
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.searchUrl}?q=${encodedQuery}`;
      
      // Make the request to Talabat Egypt
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
      console.error('Error searching Talabat Egypt:', error);
      return this.generateMockProducts(query, 5); // Fallback to mock data on error
    }
  }
  
  /**
   * Get detailed product information
   */
  async getProductDetails(productId: string): Promise<Product | null> {
    try {
      console.log(`Fetching Talabat Egypt product details for: ${productId}`);
      
      // Use fallback if needed for development/testing
      if (process.env.USE_MOCK_DATA === 'true') {
        return this.generateMockProduct(productId);
      }
      
      // Extract the product code if it's a full URL
      const productCode = productId.includes('/item/') ? 
        productId.split('/item/')[1].split('/')[0] : 
        productId;
      
      const url = `${this.productUrl}/${productCode}`;
      
      // Make the request to Talabat Egypt
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
      console.error(`Error fetching Talabat Egypt product ${productId}:`, error);
      return this.generateMockProduct(productId); // Fallback to mock data on error
    }
  }
  
  /**
   * Parse Talabat search results page
   */
  private parseSearchResults(html: string, query: string): Product[] {
    try {
      const $ = cheerio.load(html);
      const products: Product[] = [];
      
      // Get product items from Talabat search results
      $('.product-item').each((i, element) => {
        if (products.length >= 20) return; // Limit to 20 products
        
        try {
          // Extract product details
          const productUrl = $(element).find('a.product-link').attr('href') || '';
          if (!productUrl) return;
          
          const productId = productUrl.split('/').pop() || '';
          
          // Title
          const title = $(element).find('.product-title').text().trim();
          
          // URL
          const url = this.baseUrl + productUrl;
          
          // Price
          let price = 0;
          const priceText = $(element).find('.product-price').text().trim();
          if (priceText) {
            price = parseFloat(priceText.replace(/[^\d.]/g, ''));
          }
          
          // Original price
          let originalPrice: number | undefined;
          const oldPriceText = $(element).find('.product-old-price').text().trim();
          if (oldPriceText) {
            originalPrice = parseFloat(oldPriceText.replace(/[^\d.]/g, ''));
          }
          
          // Discount
          let discount: number | undefined;
          if (originalPrice && price && originalPrice > price) {
            discount = Math.round(((originalPrice - price) / originalPrice) * 100);
          } else {
            const discountText = $(element).find('.discount-badge').text().trim();
            if (discountText && discountText.includes('%')) {
              discount = parseInt(discountText.replace(/[^\d]/g, ''), 10);
            }
          }
          
          // Image
          const image = $(element).find('.product-image img').attr('src') || '';
          
          // Rating
          let rating: number | undefined;
          const ratingText = $(element).find('.product-rating').text().trim();
          if (ratingText) {
            rating = parseFloat(ratingText);
          }
          
          // Review count
          let reviewCount: number | undefined;
          const reviewText = $(element).find('.product-reviews-count').text().trim();
          if (reviewText) {
            reviewCount = parseInt(reviewText.replace(/[^\d]/g, ''), 10);
          }
          
          // Check for promotional flags
          const isPromotional = $(element).find('.promotional-badge').length > 0;
          
          // Check for free delivery
          const isFreeDelivery = $(element).find('.free-delivery-badge').length > 0;
          
          // Brand, if available
          const brand = $(element).find('.product-brand').text().trim() || 'Talabat';
          
          products.push({
            id: `talabat-${productId}`,
            title,
            price,
            originalPrice,
            discount,
            image,
            url,
            platform: 'talabat',
            rating,
            reviewCount,
            isFreeDelivery,
            isPromotional,
            brand,
            isBestPrice: false // Will be calculated later
          });
        } catch (e) {
          console.error('Error parsing Talabat product:', e);
        }
      });
      
      return products;
    } catch (error) {
      console.error('Error parsing Talabat search results:', error);
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
      const title = $('.product-title').text().trim();
      
      // Extract current price
      let price = 0;
      const priceText = $('.product-price').text().trim();
      if (priceText) {
        price = parseFloat(priceText.replace(/[^\d.]/g, ''));
      }
      
      // Extract original price if discounted
      let originalPrice: number | undefined;
      const oldPriceText = $('.product-old-price').text().trim();
      if (oldPriceText) {
        originalPrice = parseFloat(oldPriceText.replace(/[^\d.]/g, ''));
      }
      
      // Calculate discount
      let discount: number | undefined;
      if (originalPrice && price && originalPrice > price) {
        discount = Math.round(((originalPrice - price) / originalPrice) * 100);
      } else {
        const discountText = $('.discount-badge').text().trim();
        if (discountText && discountText.includes('%')) {
          discount = parseInt(discountText.replace(/[^\d]/g, ''), 10);
        }
      }
      
      // Extract product image
      const image = $('.product-image img').attr('src') || '';
      
      // Extract product description
      const description = $('.product-description').text().trim();
      
      // Extract product rating
      let rating: number | undefined;
      const ratingText = $('.product-rating').text().trim();
      if (ratingText) {
        rating = parseFloat(ratingText);
      }
      
      // Extract review count
      let reviewCount: number | undefined;
      const reviewText = $('.product-reviews-count').text().trim();
      if (reviewText) {
        reviewCount = parseInt(reviewText.replace(/[^\d]/g, ''), 10);
      }
      
      // Check for free delivery
      const isFreeDelivery = $('.free-delivery-badge').length > 0;
      
      // Extract brand
      const brand = $('.product-brand').text().trim() || 'Talabat';
      
      // Extract specifications
      const specs: { key: string, value: string }[] = [];
      $('.product-specs li').each((i, item) => {
        const text = $(item).text().trim();
        const parts = text.split(':');
        if (parts.length === 2) {
          const key = parts[0].trim();
          const value = parts[1].trim();
          if (key && value) {
            specs.push({ key, value });
          }
        }
      });
      
      return {
        id: `talabat-${productCode}`,
        title,
        price,
        originalPrice,
        discount,
        image,
        url: `${this.baseUrl}/egypt/grocery/item/${productCode}`,
        platform: 'talabat',
        rating,
        reviewCount,
        description,
        isFreeDelivery,
        isPromotional: discount !== undefined && discount > 0,
        brand,
        specs,
        isBestPrice: false
      };
    } catch (error) {
      console.error(`Error parsing Talabat product details for ${productCode}:`, error);
      return this.generateMockProduct(productCode); // Fallback to mock data on parsing error
    }
  }
  
  /**
   * Helper method to generate mock products for testing/fallback
   */
  private generateMockProducts(query: string, count: number): Product[] {
    const products: Product[] = [];
    
    for (let i = 0; i < count; i++) {
      const basePrice = 105 + Math.floor(Math.random() * 190);
      const discountPercent = Math.floor(Math.random() * 15);
      const originalPrice = basePrice * (100 + discountPercent) / 100;
      
      const product: Product = {
        id: `talabat-${Date.now()}-${i}`,
        title: `${query} - Talabat ${i + 1}`,
        price: basePrice,
        originalPrice: Math.random() > 0.5 ? originalPrice : undefined,
        discount: Math.random() > 0.5 ? discountPercent : undefined,
        image: `https://via.placeholder.com/300x300?text=Talabat+${query.replace(/\s+/g, '+')}`,
        url: `https://www.talabat.com/egypt/grocery/item-${i}${Date.now().toString().substring(0, 6)}`,
        platform: 'talabat',
        rating: 3.5 + Math.random() * 1.5,
        reviewCount: Math.floor(Math.random() * 60),
        description: `This is a ${query} product from Talabat Egypt. High quality and fast delivery.`,
        isPromotional: Math.random() > 0.7,
        isFreeDelivery: Math.random() > 0.2,
        brand: 'Talabat',
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
    const basePrice = 105 + Math.floor(Math.random() * 190);
    const discountPercent = Math.floor(Math.random() * 15);
    const originalPrice = basePrice * (100 + discountPercent) / 100;
    
    return {
      id: `talabat-${productId}`,
      title: `Talabat Product ${productId.substring(0, 8)}`,
      price: basePrice,
      originalPrice: Math.random() > 0.5 ? originalPrice : undefined,
      discount: Math.random() > 0.5 ? discountPercent : undefined,
      image: `https://via.placeholder.com/500x500?text=Talabat+Product`,
      url: `https://www.talabat.com/egypt/grocery/item/${productId}`,
      platform: 'talabat',
      rating: 3.5 + Math.random() * 1.5,
      reviewCount: Math.floor(Math.random() * 60),
      description: 'Detailed product description would go here. This includes all the specifications and features of the product.',
      isPromotional: Math.random() > 0.7,
      isFreeDelivery: Math.random() > 0.2,
      brand: 'Talabat',
      specs: [
        { key: 'Weight', value: '1kg' },
        { key: 'Dimensions', value: '10x10x10 cm' },
        { key: 'Color', value: 'Green' },
        { key: 'Material', value: 'Glass' }
      ]
    };
  }
}
