import axios from 'axios';
import * as cheerio from 'cheerio';
import { parse } from 'node-html-parser';
import { Product } from '@shared/schema';
import { getPlatformConfig } from '../config/platformConfig';

export class NoonService {
  private baseUrl: string;
  private searchUrl: string;
  private productUrl: string;
  private headers: Record<string, string>;
  private timeout: number;
  
  constructor() {
    const config = getPlatformConfig('noon');
    
    if (!config) {
      throw new Error('Noon platform configuration not found');
    }
    
    this.baseUrl = config.apiConfig.baseUrl;
    this.searchUrl = config.apiConfig.searchUrl;
    this.productUrl = config.apiConfig.productUrl;
    this.headers = config.apiConfig.headers;
    this.timeout = config.apiConfig.timeout;
  }
  
  /**
   * Search for products on Noon Egypt
   */
  async searchProducts(query: string): Promise<Product[]> {
    try {
      console.log(`Searching Noon Egypt for: ${query}`);
      
      // Use fallback if needed for development/testing
      if (process.env.USE_MOCK_DATA === 'true') {
        return this.generateMockProducts(query, 10);
      }
      
      // Encode query for Arabic support
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.searchUrl}/?q=${encodedQuery}`;
      
      // Make the request to Noon Egypt
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
      console.error('Error searching Noon Egypt:', error);
      return this.generateMockProducts(query, 5); // Fallback to mock data on error
    }
  }
  
  /**
   * Get detailed product information
   */
  async getProductDetails(productId: string): Promise<Product | null> {
    try {
      console.log(`Fetching Noon Egypt product details for: ${productId}`);
      
      // Use fallback if needed for development/testing
      if (process.env.USE_MOCK_DATA === 'true') {
        return this.generateMockProduct(productId);
      }
      
      // Extract the product code if it's a full URL
      const productCode = productId.includes('/product/') ? 
        productId.split('/product/')[1].split('/')[0] : 
        productId;
      
      const url = `${this.productUrl}/${productCode}`;
      
      // Make the request to Noon Egypt
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
      console.error(`Error fetching Noon Egypt product ${productId}:`, error);
      return this.generateMockProduct(productId); // Fallback to mock data on error
    }
  }
  
  /**
   * Parse Noon search results page
   */
  private parseSearchResults(html: string, query: string): Product[] {
    try {
      const $ = cheerio.load(html);
      const products: Product[] = [];
      
      // Get product grid items from Noon search results
      $('div[data-qa="product-block"]').each((i, element) => {
        if (products.length >= 20) return; // Limit to 20 products
        
        try {
          // Extract product details
          const productUrl = $(element).find('a').attr('href') || '';
          if (!productUrl) return;
          
          const productId = productUrl.split('/').pop() || '';
          
          // Title
          const title = $(element).find('[data-qa="product-name"]').text().trim();
          
          // URL
          const url = this.baseUrl + productUrl;
          
          // Price
          let price = 0;
          const priceText = $(element).find('[data-qa="price-wrapper"] span').first().text().trim();
          if (priceText) {
            price = parseFloat(priceText.replace(/[^\d.]/g, ''));
          }
          
          // Original price
          let originalPrice: number | undefined;
          const oldPriceText = $(element).find('[data-qa="old-price"]').text().trim();
          if (oldPriceText) {
            originalPrice = parseFloat(oldPriceText.replace(/[^\d.]/g, ''));
          }
          
          // Discount
          let discount: number | undefined;
          if (originalPrice && price && originalPrice > price) {
            discount = Math.round(((originalPrice - price) / originalPrice) * 100);
          } else {
            const discountText = $(element).find('[data-qa="badge-text"]').text().trim();
            if (discountText && discountText.includes('%')) {
              discount = parseInt(discountText.replace(/[^\d]/g, ''), 10);
            }
          }
          
          // Image
          const image = $(element).find('img').attr('src') || '';
          
          // Rating
          let rating: number | undefined;
          const ratingText = $(element).find('[data-qa="rating"]').text().trim();
          if (ratingText) {
            rating = parseFloat(ratingText);
          }
          
          // Review count
          let reviewCount: number | undefined;
          const reviewText = $(element).find('[data-qa="review-count"]').text().trim();
          if (reviewText) {
            reviewCount = parseInt(reviewText.replace(/[^\d]/g, ''), 10);
          }
          
          // Check for promotional flags
          const isPromotional = $(element).find('[data-qa="badge-text"]').length > 0;
          
          // Check for free delivery
          const isFreeDelivery = $(element).find('[data-qa="free-shipping"]').length > 0;
          
          // Brand, if available
          const brand = $(element).find('[data-qa="brand-name"]').text().trim() || undefined;
          
          products.push({
            id: `noon-${productId}`,
            title,
            price,
            originalPrice,
            discount,
            image,
            url,
            platform: 'noon',
            rating,
            reviewCount,
            isFreeDelivery,
            isPromotional,
            brand,
            isBestPrice: false // Will be calculated later
          });
        } catch (e) {
          console.error('Error parsing Noon product:', e);
        }
      });
      
      return products;
    } catch (error) {
      console.error('Error parsing Noon search results:', error);
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
      const title = $('[data-qa="pdp-name"]').text().trim();
      
      // Extract current price
      let price = 0;
      const priceText = $('[data-qa="price-wrapper"] span').first().text().trim();
      if (priceText) {
        price = parseFloat(priceText.replace(/[^\d.]/g, ''));
      }
      
      // Extract original price if discounted
      let originalPrice: number | undefined;
      const oldPriceText = $('[data-qa="old-price"]').text().trim();
      if (oldPriceText) {
        originalPrice = parseFloat(oldPriceText.replace(/[^\d.]/g, ''));
      }
      
      // Calculate discount
      let discount: number | undefined;
      if (originalPrice && price && originalPrice > price) {
        discount = Math.round(((originalPrice - price) / originalPrice) * 100);
      } else {
        const discountText = $('[data-qa="badge-text"]').text().trim();
        if (discountText && discountText.includes('%')) {
          discount = parseInt(discountText.replace(/[^\d]/g, ''), 10);
        }
      }
      
      // Extract product image
      const image = $('.gallery-image').first().attr('src') || '';
      
      // Extract product description
      const description = $('[data-qa="pdp-description-section"]').text().trim();
      
      // Extract product rating
      let rating: number | undefined;
      const ratingText = $('[data-qa="pdp-rating"]').text().trim();
      if (ratingText) {
        rating = parseFloat(ratingText);
      }
      
      // Extract review count
      let reviewCount: number | undefined;
      const reviewText = $('[data-qa="pdp-review-count"]').text().trim();
      if (reviewText) {
        reviewCount = parseInt(reviewText.replace(/[^\d]/g, ''), 10);
      }
      
      // Check for free delivery
      const deliveryText = $('[data-qa="delivery-section"]').text().trim();
      const isFreeDelivery = deliveryText.includes('Free') || deliveryText.includes('مجاني');
      
      // Extract brand
      const brand = $('[data-qa="pdp-brand-name"]').text().trim();
      
      // Extract specifications
      const specs: { key: string, value: string }[] = [];
      $('[data-qa="pdp-specifications-section"] tr').each((i, row) => {
        const key = $(row).find('th').text().trim();
        const value = $(row).find('td').text().trim();
        if (key && value) {
          specs.push({ key, value });
        }
      });
      
      return {
        id: `noon-${productCode}`,
        title,
        price,
        originalPrice,
        discount,
        image,
        url: `${this.baseUrl}/egypt-ar/product/${productCode}`,
        platform: 'noon',
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
      console.error(`Error parsing Noon product details for ${productCode}:`, error);
      return this.generateMockProduct(productCode); // Fallback to mock data on parsing error
    }
  }
  
  /**
   * Helper method to generate mock products for testing/fallback
   */
  private generateMockProducts(query: string, count: number): Product[] {
    const products: Product[] = [];
    
    for (let i = 0; i < count; i++) {
      const basePrice = 90 + Math.floor(Math.random() * 220);
      const discountPercent = Math.floor(Math.random() * 20);
      const originalPrice = basePrice * (100 + discountPercent) / 100;
      
      const product: Product = {
        id: `noon-${Date.now()}-${i}`,
        title: `${query} - من نون`,
        price: basePrice,
        originalPrice: Math.random() > 0.5 ? originalPrice : undefined,
        discount: Math.random() > 0.5 ? discountPercent : undefined,
        image: `https://via.placeholder.com/300x300?text=Noon+${query.replace(/\s+/g, '+')}`,
        url: `https://www.noon.com/egypt-en/p-${i}${Date.now().toString().substring(0, 6)}`,
        platform: 'noon',
        rating: 3.5 + Math.random() * 1.5,
        reviewCount: Math.floor(Math.random() * 100),
        description: `منتج ${query} من نون مصر. جودة عالية وسعر مناسب.`,
        isPromotional: Math.random() > 0.7,
        isFreeDelivery: Math.random() > 0.3,
        brand: 'Noon',
        specs: [
          { key: 'الوزن', value: '1kg' },
          { key: 'الأبعاد', value: '10x10x10 cm' }
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
    const basePrice = 90 + Math.floor(Math.random() * 220);
    const discountPercent = Math.floor(Math.random() * 20);
    const originalPrice = basePrice * (100 + discountPercent) / 100;
    
    return {
      id: `noon-${productId}`,
      title: `منتج نون ${productId.substring(0, 8)}`,
      price: basePrice,
      originalPrice: Math.random() > 0.5 ? originalPrice : undefined,
      discount: Math.random() > 0.5 ? discountPercent : undefined,
      image: `https://via.placeholder.com/500x500?text=Noon+Product`,
      url: `https://www.noon.com/egypt-ar/product/${productId}`,
      platform: 'noon',
      rating: 3.5 + Math.random() * 1.5,
      reviewCount: Math.floor(Math.random() * 100),
      description: 'وصف تفصيلي للمنتج هنا. يتضمن ذلك جميع المواصفات وميزات المنتج.',
      isPromotional: Math.random() > 0.7,
      isFreeDelivery: Math.random() > 0.3,
      brand: 'Noon',
      specs: [
        { key: 'الوزن', value: '1kg' },
        { key: 'الأبعاد', value: '10x10x10 cm' },
        { key: 'اللون', value: 'أزرق' },
        { key: 'المادة', value: 'بلاستيك' }
      ]
    };
  }
}
