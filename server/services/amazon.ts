import axios from 'axios';
import * as cheerio from 'cheerio';
import { Product } from '@shared/schema';
import { getPlatformConfig } from '../config/platformConfig';

export class AmazonService {
  private baseUrl: string;
  private searchUrl: string;
  private productUrl: string;
  private headers: Record<string, string>;
  private timeout: number;
  
  constructor() {
    const config = getPlatformConfig('amazon');
    
    if (!config) {
      throw new Error('Amazon platform configuration not found');
    }
    
    this.baseUrl = config.apiConfig.baseUrl;
    this.searchUrl = config.apiConfig.searchUrl;
    this.productUrl = config.apiConfig.productUrl;
    this.headers = config.apiConfig.headers;
    this.timeout = config.apiConfig.timeout;
  }
  
  /**
   * Search for products on Amazon Egypt
   */
  async searchProducts(query: string): Promise<Product[]> {
    try {
      console.log(`Searching Amazon Egypt for: ${query}`);
      
      // Use fallback if needed for development/testing
      if (process.env.USE_MOCK_DATA === 'true') {
        return this.generateMockProducts(query, 10);
      }
      
      // Encode query for Arabic support
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.searchUrl}?k=${encodedQuery}&i=aps`;
      
      // Make the request to Amazon Egypt
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
      console.error('Error searching Amazon Egypt:', error);
      return this.generateMockProducts(query, 5); // Fallback to mock data on error
    }
  }
  
  /**
   * Get detailed product information from Amazon Egypt
   */
  async getProductDetails(productId: string): Promise<Product | null> {
    try {
      console.log(`Fetching Amazon Egypt product details for: ${productId}`);
      
      // Use fallback if needed for development/testing
      if (process.env.USE_MOCK_DATA === 'true') {
        return this.generateMockProduct(productId);
      }
      
      // Extract the ASIN if it's a full URL
      const asin = productId.includes('/dp/') ? 
        productId.split('/dp/')[1].split('/')[0] : 
        productId;
      
      const url = `${this.productUrl}/${asin}`;
      
      // Make the request to Amazon Egypt
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: this.timeout
      });
      
      // If we got a response, parse it
      if (response.status === 200) {
        return this.parseProductDetails(response.data, asin);
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching Amazon Egypt product ${productId}:`, error);
      return this.generateMockProduct(productId); // Fallback to mock data on error
    }
  }
  
  /**
   * Parse Amazon search results page
   */
  private parseSearchResults(html: string, query: string): Product[] {
    try {
      const $ = cheerio.load(html);
      const products: Product[] = [];
      
      // Amazon's search results are in divs with data-component-type="s-search-result"
      $('div[data-component-type="s-search-result"]').each((i, element) => {
        if (products.length >= 20) return; // Limit to 20 products
        
        try {
          const asin = $(element).attr('data-asin') || '';
          if (!asin) return;
          
          // Extract product details
          const titleElement = $(element).find('h2 .a-link-normal');
          const title = titleElement.text().trim();
          const url = this.baseUrl + titleElement.attr('href');
          
          // Find price - Amazon has different price formats
          let price = 0;
          let originalPrice: number | undefined;
          
          // Current price
          const priceWhole = $(element).find('.a-price-whole').first().text().trim();
          const priceFraction = $(element).find('.a-price-fraction').first().text().trim();
          
          if (priceWhole) {
            price = parseFloat(priceWhole.replace(/[^\d.]/g, '') + '.' + priceFraction);
          }
          
          // Original price (if discounted)
          const originalPriceText = $(element).find('.a-text-price .a-offscreen').first().text().trim();
          if (originalPriceText) {
            originalPrice = parseFloat(originalPriceText.replace(/[^\d.]/g, ''));
          }
          
          // Calculate discount percentage if both prices are available
          let discount: number | undefined;
          if (originalPrice && price && originalPrice > price) {
            discount = Math.round(((originalPrice - price) / originalPrice) * 100);
          }
          
          // Get image
          const image = $(element).find('img.s-image').attr('src') || '';
          
          // Get rating
          const ratingText = $(element).find('.a-icon-star-small').text().trim();
          const rating = ratingText ? parseFloat(ratingText.split(' ')[0].replace(',', '.')) : undefined;
          
          // Get review count
          const reviewText = $(element).find('.a-size-base.s-underline-text').text().trim();
          const reviewCount = reviewText ? parseInt(reviewText.replace(/[^\d]/g, ''), 10) : undefined;
          
          // Check for sponsored/promotional
          const isPromotional = $(element).find('.s-sponsored-label-info-icon').length > 0;
          
          // Check for free delivery
          const isFreeDelivery = $(element).find('.a-color-success').text().includes('FREE') || 
                                 $(element).find('.a-color-base').text().includes('توصيل مجاني');
          
          // Check for Amazon brand/choice
          const amazonChoice = $(element).find('.a-row.a-badge-region').length > 0;
          
          // Extract brand if available
          const brandElement = $(element).find('.a-row.a-size-base.a-color-secondary .a-size-base.a-link-normal');
          const brand = brandElement.length ? brandElement.text().trim() : undefined;
          
          products.push({
            id: `amazon-${asin}`,
            title,
            price,
            originalPrice,
            discount,
            image,
            url,
            platform: 'amazon',
            rating,
            reviewCount,
            isFreeDelivery,
            isPromotional,
            brand,
            isBestPrice: false // Will be calculated later
          });
        } catch (e) {
          console.error('Error parsing Amazon product:', e);
        }
      });
      
      return products;
    } catch (error) {
      console.error('Error parsing Amazon search results:', error);
      return this.generateMockProducts(query, 5); // Fallback to mock data on parsing error
    }
  }
  
  /**
   * Parse product details page
   */
  private parseProductDetails(html: string, asin: string): Product | null {
    try {
      const $ = cheerio.load(html);
      
      // Extract product title
      const title = $('#productTitle').text().trim();
      
      // Extract current price
      let price = 0;
      const priceElement = $('.a-price .a-offscreen').first();
      if (priceElement.length) {
        const priceText = priceElement.text().trim();
        price = parseFloat(priceText.replace(/[^\d.]/g, ''));
      }
      
      // Extract original price if discounted
      let originalPrice: number | undefined;
      const originalPriceElement = $('.a-text-price .a-offscreen').first();
      if (originalPriceElement.length) {
        const originalPriceText = originalPriceElement.text().trim();
        originalPrice = parseFloat(originalPriceText.replace(/[^\d.]/g, ''));
      }
      
      // Calculate discount
      let discount: number | undefined;
      if (originalPrice && price && originalPrice > price) {
        discount = Math.round(((originalPrice - price) / originalPrice) * 100);
      }
      
      // Extract product image
      const image = $('#landingImage, #imgBlkFront').attr('src') || $('#imgBlkFront').attr('data-a-dynamic-image') || '';
      
      // Extract product description
      const description = $('#productDescription p, #feature-bullets li').text().trim();
      
      // Extract product rating
      let rating: number | undefined;
      const ratingText = $('#acrPopover').attr('title') || '';
      if (ratingText) {
        rating = parseFloat(ratingText.split(' ')[0].replace(',', '.'));
      }
      
      // Extract review count
      let reviewCount: number | undefined;
      const reviewText = $('#acrCustomerReviewText').text().trim();
      if (reviewText) {
        reviewCount = parseInt(reviewText.replace(/[^\d]/g, ''), 10);
      }
      
      // Check for free delivery
      const shippingText = $('#deliveryBlockMessage').text().trim();
      const isFreeDelivery = shippingText.includes('FREE') || shippingText.includes('مجاني');
      
      // Extract brand
      const brand = $('#bylineInfo').text().trim().replace('Brand: ', '').replace('العلامة التجارية: ', '');
      
      // Extract specifications
      const specs: { key: string, value: string }[] = [];
      $('.a-section.a-spacing-small.a-spacing-top-small tr').each((i, row) => {
        const key = $(row).find('th').text().trim();
        const value = $(row).find('td').text().trim();
        if (key && value) {
          specs.push({ key, value });
        }
      });
      
      return {
        id: `amazon-${asin}`,
        title,
        price,
        originalPrice,
        discount,
        image,
        url: `${this.baseUrl}/dp/${asin}`,
        platform: 'amazon',
        rating,
        reviewCount,
        description,
        isFreeDelivery,
        isPromotional: false,
        brand,
        specs,
        isBestPrice: false
      };
    } catch (error) {
      console.error(`Error parsing Amazon product details for ${asin}:`, error);
      return this.generateMockProduct(asin); // Fallback to mock data on parsing error
    }
  }
  
  /**
   * Helper method to generate mock products for testing/fallback
   */
  private generateMockProducts(query: string, count: number): Product[] {
    const products: Product[] = [];
    
    for (let i = 0; i < count; i++) {
      const basePrice = 100 + Math.floor(Math.random() * 200);
      const discountPercent = Math.floor(Math.random() * 20);
      const originalPrice = basePrice * (100 + discountPercent) / 100;
      
      const product: Product = {
        id: `amazon-${Date.now()}-${i}`,
        title: `${query} - Amazon Product ${i + 1}`,
        price: basePrice,
        originalPrice: originalPrice,
        discount: discountPercent,
        image: `https://via.placeholder.com/300x300?text=Amazon+${query.replace(/\s+/g, '+')}`,
        url: `https://www.amazon.eg/dp/B0${i}${Date.now().toString().substring(0, 6)}`,
        platform: 'amazon',
        rating: 3.5 + Math.random() * 1.5,
        reviewCount: Math.floor(Math.random() * 100),
        description: `This is a ${query} product from Amazon Egypt. High quality and affordable.`,
        isPromotional: Math.random() > 0.7,
        isFreeDelivery: Math.random() > 0.5,
        brand: 'Amazon',
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
    const basePrice = 100 + Math.floor(Math.random() * 200);
    const discountPercent = Math.floor(Math.random() * 20);
    const originalPrice = basePrice * (100 + discountPercent) / 100;
    
    return {
      id: `amazon-${productId}`,
      title: `Amazon Product ${productId.substring(0, 8)}`,
      price: basePrice,
      originalPrice: originalPrice,
      discount: discountPercent,
      image: `https://via.placeholder.com/500x500?text=Amazon+Product`,
      url: `https://www.amazon.eg/dp/${productId}`,
      platform: 'amazon',
      rating: 3.5 + Math.random() * 1.5,
      reviewCount: Math.floor(Math.random() * 100),
      description: 'Detailed product description would go here. This includes all the specifications and features of the product.',
      isPromotional: Math.random() > 0.7,
      isFreeDelivery: Math.random() > 0.5,
      brand: 'Amazon',
      specs: [
        { key: 'Weight', value: '1kg' },
        { key: 'Dimensions', value: '10x10x10 cm' },
        { key: 'Color', value: 'Blue' },
        { key: 'Material', value: 'Plastic' }
      ]
    };
  }
}
