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
      
      // Encode query for Arabic support
      const encodedQuery = encodeURIComponent(query);
      
      // Try the direct search URL which returns HTML with embedded JSON data
      const directUrl = `${this.searchUrl}/?q=${encodedQuery}`;
      
      console.log(`Making request to Noon search URL: ${directUrl}`);
      
      try {
        // Use standard browser-like headers
        const response = await axios.get(directUrl, {
          headers: {
            ...this.headers,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Referer': 'https://www.noon.com/egypt-ar/'
          },
          timeout: 15000 // Increase timeout for better reliability
        });
        
        if (response.status === 200) {
          console.log('Successfully got Noon HTML response, extracting products');
          
          // First try to extract JSON data from HTML - Look for all script tags
          try {
            const html = response.data;
            console.log('Scanning Noon HTML for product data...');
            
            // Log some debug info to see what we're working with
            const scriptTags = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
            console.log(`Found ${scriptTags.length} script tags in Noon response`);
            
            // Try to find product data in any script tag
            let foundProducts = false;
            
            // Look for product data in the HTML itself
            if (html.includes('productTitle') || html.includes('product-title')) {
              console.log('Found product title markers in HTML');
            }
            
            // Try all possible script tags that might contain product data
            for (const scriptTag of scriptTags) {
              try {
                if (scriptTag.includes('__NEXT_DATA__')) {
                  const jsonContent = scriptTag.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
                  const jsonData = JSON.parse(jsonContent);
                  
                  console.log('Found __NEXT_DATA__ script, checking for search results...');
                  
                  // Log the structure to debug
                  if (jsonData.props && jsonData.props.pageProps) {
                    console.log('Page props keys:', Object.keys(jsonData.props.pageProps));
                    
                    if (jsonData.props.pageProps.searchResult) {
                      console.log('Search result keys:', Object.keys(jsonData.props.pageProps.searchResult));
                      
                      if (jsonData.props.pageProps.searchResult.hits) {
                        console.log(`Found ${jsonData.props.pageProps.searchResult.hits.length} products in JSON data`);
                        foundProducts = true;
                        return this.parseJsonSearchResults(jsonData.props.pageProps.searchResult, query);
                      }
                    }
                    
                    // Try alternative paths in the JSON structure
                    if (jsonData.props.pageProps.initialReduxState) {
                      console.log('Found initialReduxState, checking for search results...');
                      
                      if (jsonData.props.pageProps.initialReduxState.searchResult) {
                        console.log('Found searchResult in initialReduxState');
                        const searchResult = jsonData.props.pageProps.initialReduxState.searchResult;
                        
                        if (searchResult.hits || searchResult.products) {
                          const hits = searchResult.hits || searchResult.products;
                          console.log(`Found ${hits.length} products in initialReduxState`);
                          foundProducts = true;
                          return this.parseJsonSearchResults({hits}, query);
                        }
                      }
                    }
                  }
                }
                // Check for other JSON data in script tags
                else if (scriptTag.includes('window.__INITIAL_DATA__') || 
                        scriptTag.includes('products') || 
                        scriptTag.includes('searchResults')) {
                  console.log('Found potential product data script');
                }
              } catch (e) {
                // Continue to next script tag
              }
            }
            
            if (!foundProducts) {
              console.log('Could not extract product data from scripts, falling back to HTML parsing');
            }
          } catch (jsonError) {
            console.log('Failed to extract JSON data from HTML, falling back to HTML parsing', jsonError);
          }
          
          // If JSON extraction fails, parse the HTML directly
          console.log('Parsing Noon HTML for products...');
          return this.parseSearchResults(response.data, query);
        }
      } catch (error) {
        console.error('Noon search request failed:', error);
      }
      
      return [];
    } catch (error) {
      console.error('Error searching Noon Egypt:', error);
      return []; // Return empty array instead of mock data
    }
  }
  
  /**
   * Parse Noon search results from JSON response
   */
  private parseJsonSearchResults(data: any, query: string): Product[] {
    try {
      const products: Product[] = [];
      
      // Check if data has hits array (search results)
      if (data.hits && Array.isArray(data.hits)) {
        for (const item of data.hits) {
          if (products.length >= 20) break; // Limit to 20 products
          
          try {
            // Extract product ID
            const productId = item.sku || item.product_id || '';
            if (!productId) continue;
            
            // Extract title
            const title = item.name || item.title || '';
            
            // Extract price
            let price = 0;
            if (item.price && item.price.value) {
              price = parseFloat(String(item.price.value));
            } else if (item.sale_price) {
              price = parseFloat(String(item.sale_price));
            }
            
            // Extract original price if available
            let originalPrice: number | undefined;
            if (item.price && item.price.was && item.price.was > price) {
              originalPrice = parseFloat(String(item.price.was));
            } else if (item.regular_price && item.regular_price > price) {
              originalPrice = parseFloat(String(item.regular_price));
            }
            
            // Calculate discount percentage
            let discount: number | undefined;
            if (originalPrice && price && originalPrice > price) {
              discount = Math.round(((originalPrice - price) / originalPrice) * 100);
            } else if (item.discount && item.discount.percent) {
              discount = parseInt(String(item.discount.percent), 10);
            }
            
            // Extract image URL
            let image = '';
            if (item.image_keys && item.image_keys.length > 0) {
              // Format image URL based on image key
              image = `https://k.nooncdn.com/t_desktop-thumbnail-v2/${item.image_keys[0]}.jpg`;
            } else if (item.image) {
              image = item.image;
            }
            
            // Extract URL
            const url = `${this.baseUrl}/egypt-ar/product/${productId}`;
            
            // Extract brand
            const brand = item.brand || '';
            
            // Extract rating and review count
            const rating = item.rating && item.rating.average ? parseFloat(String(item.rating.average)) : undefined;
            const reviewCount = item.rating && item.rating.count ? parseInt(String(item.rating.count), 10) : undefined;
            
            // Check for free delivery
            const isFreeDelivery = item.shipping && item.shipping.is_free_shipping === true;
            
            // Check for promotional flags
            const isPromotional = discount !== undefined && discount > 0;
            
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
              isBestPrice: false
            });
          } catch (e) {
            console.error('Error parsing Noon product from JSON:', e);
          }
        }
      }
      
      return products;
    } catch (error) {
      console.error('Error parsing Noon JSON search results:', error);
      return []; // Return empty array instead of mock data
    }
  }
  
  /**
   * Get detailed product information
   */
  async getProductDetails(productId: string): Promise<Product | null> {
    try {
      console.log(`Fetching Noon Egypt product details for: ${productId}`);
      
      // Extract the product code if it's a full URL
      const productCode = productId.includes('/product/') ? 
        productId.split('/product/')[1].split('/')[0] : 
        productId;
      
      // First try the API endpoint to get JSON data
      const apiUrl = `${this.baseUrl}/egypt-ar/productapi/v3/${productCode}`;
      const fallbackUrl = `${this.productUrl}/${productCode}`;
      
      try {
        // Try the API endpoint first
        const apiResponse = await axios.get(apiUrl, {
          headers: {
            ...this.headers,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        });
        
        if (apiResponse.status === 200 && apiResponse.data) {
          console.log('Successfully used Noon API endpoint for product details');
          return this.parseJsonProductDetails(apiResponse.data, productCode);
        }
      } catch (apiError) {
        console.log('Noon API endpoint failed for product details, falling back to HTML scraping', apiError);
      }
      
      // Fallback to HTML scraping if API endpoint fails
      const response = await axios.get(fallbackUrl, {
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
      return null; // Return null instead of mock data
    }
  }
  
  /**
   * Parse Noon product details from JSON response
   */
  private parseJsonProductDetails(data: any, productCode: string): Product | null {
    try {
      // Check if data is valid
      if (!data || !data.product) {
        return null;
      }
      
      const product = data.product;
      
      // Extract title
      const title = product.name || product.title || '';
      
      // Extract price
      let price = 0;
      if (product.price && product.price.value) {
        price = parseFloat(String(product.price.value));
      } else if (product.sale_price) {
        price = parseFloat(String(product.sale_price));
      }
      
      // Extract original price if available
      let originalPrice: number | undefined;
      if (product.price && product.price.was && product.price.was > price) {
        originalPrice = parseFloat(String(product.price.was));
      } else if (product.regular_price && product.regular_price > price) {
        originalPrice = parseFloat(String(product.regular_price));
      }
      
      // Calculate discount percentage
      let discount: number | undefined;
      if (originalPrice && price && originalPrice > price) {
        discount = Math.round(((originalPrice - price) / originalPrice) * 100);
      } else if (product.discount && product.discount.percent) {
        discount = parseInt(String(product.discount.percent), 10);
      }
      
      // Extract image URL
      let image = '';
      if (product.image_keys && product.image_keys.length > 0) {
        // Format image URL based on image key
        image = `https://k.nooncdn.com/t_desktop-pdp-v1/${product.image_keys[0]}.jpg`;
      } else if (product.image) {
        image = product.image;
      }
      
      // Extract URL
      const url = `${this.baseUrl}/egypt-ar/product/${productCode}`;
      
      // Extract brand
      const brand = product.brand ? product.brand.name || product.brand : '';
      
      // Extract rating and review count
      const rating = product.rating && product.rating.average ? parseFloat(String(product.rating.average)) : undefined;
      const reviewCount = product.rating && product.rating.count ? parseInt(String(product.rating.count), 10) : undefined;
      
      // Extract description
      const description = product.description || '';
      
      // Check for free delivery
      const isFreeDelivery = product.shipping && product.shipping.is_free_shipping === true;
      
      // Extract specifications
      const specs: { key: string, value: string }[] = [];
      if (product.specifications && Array.isArray(product.specifications)) {
        product.specifications.forEach((spec: any) => {
          if (spec && spec.name && spec.value) {
            specs.push({ key: spec.name, value: spec.value });
          }
        });
      }
      
      return {
        id: `noon-${productCode}`,
        title,
        price,
        originalPrice,
        discount,
        image,
        url,
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
      console.error(`Error parsing Noon product details JSON for ${productCode}:`, error);
      return null; // Return null instead of mock data
    }
  }
  
  /**
   * Parse Noon search results page
   */
  private parseSearchResults(html: string, query: string): Product[] {
    try {
      const $ = cheerio.load(html);
      const products: Product[] = [];
      
      console.log('Parsing Noon HTML search results...');
      
      // Log all possible product containers we find
      const productBlockCount = $('div[data-qa="product-block"]').length;
      const productCardCount = $('.product-card, .productCard, .product-item, [data-testid="product-card"]').length;
      const productGridCount = $('.productGrid, .product-grid, .products-grid').length;
      
      console.log(`Product containers found: Block=${productBlockCount}, Card=${productCardCount}, Grid=${productGridCount}`);
      
      // Define a function to extract product details from a container element
      const parseProductElement = (element: any) => {
        if (products.length >= 20) return; // Limit to 20 products
        
        try {
            // Extract product details
            const productUrl = $(element).find('a').attr('href') || '';
            if (!productUrl) return;
            
            const productId = productUrl.split('/').pop() || '';
            
            // Title
            const title = $(element).find('[data-qa="product-name"]').text().trim();
            
            // URL
            const url = productUrl.startsWith('http') ? productUrl : this.baseUrl + productUrl;
            
            // Price
            let price = 0;
            const priceText = $(element).find('[data-qa="price-wrapper"] span, .price').first().text().trim();
            if (priceText) {
              price = parseFloat(priceText.replace(/[^\d.]/g, ''));
            }
            
            // Original price
            let originalPrice: number | undefined;
            const oldPriceText = $(element).find('[data-qa="old-price"], .old-price, .originalPrice').text().trim();
            if (oldPriceText) {
              originalPrice = parseFloat(oldPriceText.replace(/[^\d.]/g, ''));
            }
            
            // Discount
            let discount: number | undefined;
            if (originalPrice && price && originalPrice > price) {
              discount = Math.round(((originalPrice - price) / originalPrice) * 100);
            } else {
              const discountText = $(element).find('[data-qa="badge-text"], .discount, .discountBadge').text().trim();
              if (discountText && discountText.includes('%')) {
                discount = parseInt(discountText.replace(/[^\d]/g, ''), 10);
              }
            }
            
            // Image
            const image = $(element).find('img').attr('src') || '';
            
            // Rating
            let rating: number | undefined;
            const ratingText = $(element).find('[data-qa="rating"], .rating').text().trim();
            if (ratingText) {
              rating = parseFloat(ratingText);
            }
            
            // Review count
            let reviewCount: number | undefined;
            const reviewText = $(element).find('[data-qa="review-count"], .reviewCount').text().trim();
            if (reviewText) {
              reviewCount = parseInt(reviewText.replace(/[^\d]/g, ''), 10);
            }
            
            // Check for promotional flags
            const isPromotional = $(element).find('[data-qa="badge-text"], .discount-badge').length > 0 || discount !== undefined;
            
            // Check for free delivery
            const isFreeDelivery = $(element).find('[data-qa="free-shipping"], .free-shipping, .freeDelivery').length > 0;
            
            // Brand, if available
            const brand = $(element).find('[data-qa="brand-name"], .brand-name, .brandName').text().trim() || 'Noon';
            
            console.log(`Found Noon product: ${title} at ${price} EGP`);
            
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
      };
      
      // Try different selectors to find product containers
      if (productBlockCount > 0) {
        console.log('Processing Noon products using data-qa="product-block" selector');
        $('div[data-qa="product-block"]').each((i, element) => parseProductElement(element));
      }
      
      // If no products found yet, try alternative selectors
      if (products.length === 0 && productCardCount > 0) {
        console.log('Processing Noon products using product card selectors');
        $('.product-card, .productCard, .product-item, [data-testid="product-card"]').each((i, element) => parseProductElement(element));
      }
      
      // If still no products, try looking for product grid items
      if (products.length === 0) {
        console.log('Trying to process products from grid items');
        $('a[href*="product/"]').each((i, element) => {
          const parent = $(element).parent().parent();
          parseProductElement(parent);
        });
      }
      
      console.log(`Found ${products.length} Noon products`);
      return products;
    } catch (error) {
      console.error('Error parsing Noon search results:', error);
      return []; // Return empty array instead of mock data
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
      return null; // Return null instead of mock data
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
