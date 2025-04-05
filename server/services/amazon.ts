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
      
      // Encode query for Arabic support
      const encodedQuery = encodeURIComponent(query);
      
      console.log('Amazon search is often blocked by their bot protection.');
      console.log('Attempting search with enhanced browser-like headers...');
      const url = `${this.searchUrl}?k=${encodedQuery}&i=aps`;
      
      console.log(`Making request to Amazon URL: ${url}`);
      
      // Make the request to Amazon Egypt with enhanced browser-like headers
      const response = await axios.get(url, {
        headers: {
          ...this.headers,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'max-age=0',
          'Connection': 'keep-alive',
          'Referer': 'https://www.amazon.eg/',
          'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 15000, // Increased timeout
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 500 // Accept all non-server error responses for debugging
      });
      
      // If we got a response, parse it
      if (response.status === 200) {
        return this.parseSearchResults(response.data, query);
      }
      
      return [];
    } catch (error) {
      console.error('Error searching Amazon Egypt:', error);
      return []; // Return empty array instead of mock data
    }
  }
  
  /**
   * Get detailed product information from Amazon Egypt
   */
  async getProductDetails(productId: string): Promise<Product | null> {
    try {
      console.log(`Fetching Amazon Egypt product details for: ${productId}`);
      
      // Extract the ASIN if it's a full URL
      const asin = productId.includes('/dp/') ? 
        productId.split('/dp/')[1].split('/')[0] : 
        productId;
      
      const url = `${this.productUrl}/${asin}`;
      
      console.log(`Making request to Amazon product URL: ${url}`);
      
      // Make the request to Amazon Egypt with enhanced browser-like headers
      const response = await axios.get(url, {
        headers: {
          ...this.headers,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'max-age=0',
          'Connection': 'keep-alive',
          'Referer': 'https://www.amazon.eg/s',
          'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 15000, // Increased timeout
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 500 // Accept all non-server error responses for debugging
      });
      
      // If we got a response, parse it
      if (response.status === 200) {
        return this.parseProductDetails(response.data, asin);
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching Amazon Egypt product ${productId}:`, error);
      return null; // Return null instead of mock data
    }
  }
  
  /**
   * Parse Amazon search results page
   */
  private parseSearchResults(html: string, query: string): Product[] {
    try {
      const $ = cheerio.load(html);
      const products: Product[] = [];
      
      // Check if we're getting a captcha page
      if (html.includes('captcha') || html.includes('CAPTCHA') || html.includes('To discuss automated access to Amazon data please contact')) {
        console.log('Amazon returned a CAPTCHA page. Cannot proceed with scraping.');
        return [];
      }
      
      // Try to extract JSON data first - Amazon sometimes stores search results in embedded JSON
      try {
        // Look for any script tags containing product data
        const scripts = $('script').toArray();
        for (const script of scripts) {
          const scriptContent = $(script).html() || '';
          
          // Look for patterns that might contain product data
          if (scriptContent.includes('"products":') || scriptContent.includes('"searchResults":') || 
              scriptContent.includes('"search-results":') || scriptContent.includes('"asin"')) {
            try {
              // Extract the JSON from the script
              const jsonMatch = scriptContent.match(/({.+})/);
              if (jsonMatch) {
                const jsonData = JSON.parse(jsonMatch[0]);
                
                // Check if this contains product data
                if (jsonData.products || jsonData.searchResults || jsonData.results) {
                  const items = jsonData.products || jsonData.searchResults || jsonData.results || [];
                  
                  // Process each product from the JSON data
                  items.forEach((item: any) => {
                    if (products.length >= 20) return; // Limit to 20 products
                    
                    try {
                      const asin = item.asin || item.id || '';
                      if (!asin) return;
                      
                      const product: Product = {
                        id: `amazon-${asin}`,
                        title: item.title || '',
                        price: parseFloat(item.price?.amount || item.price || '0'),
                        originalPrice: item.originalPrice ? parseFloat(item.originalPrice) : undefined,
                        discount: item.discount,
                        image: item.image || item.imageUrl || '',
                        url: item.url || `${this.baseUrl}/dp/${asin}`,
                        platform: 'amazon',
                        rating: item.rating,
                        reviewCount: item.reviewCount,
                        brand: item.brand,
                        isFreeDelivery: item.isFreeDelivery || false,
                        isPromotional: item.isSponsored || false,
                        isBestPrice: false
                      };
                      
                      products.push(product);
                    } catch (e) {
                      console.error('Error parsing Amazon JSON product:', e);
                    }
                  });
                  
                  // If we found products in the JSON, return them
                  if (products.length > 0) {
                    console.log(`Found ${products.length} products in Amazon JSON data`);
                    return products;
                  }
                }
              }
            } catch (e) {
              // Just continue to the next script
            }
          }
        }
      } catch (e) {
        console.error('Error extracting Amazon JSON data:', e);
      }
      
      console.log('Falling back to HTML parsing for Amazon search results');
      
      // Fallback to HTML parsing
      // Amazon's search results are in divs with data-component-type="s-search-result"
      $('div[data-component-type="s-search-result"]').each((i, element) => {
        if (products.length >= 20) return; // Limit to 20 products
        
        try {
          const asin = $(element).attr('data-asin') || '';
          if (!asin) return;
          
          // Extract product details
          const titleElement = $(element).find('h2 .a-link-normal');
          const title = titleElement.text().trim();
          const url = this.baseUrl + (titleElement.attr('href') || `/dp/${asin}`);
          
          // Find price - Amazon has different price formats
          let price = 0;
          let originalPrice: number | undefined;
          
          // Try different price selectors
          const priceSelectors = [
            // Standard price
            { whole: '.a-price-whole', fraction: '.a-price-fraction' },
            // Arabic price
            { whole: '.a-price .a-price-whole', fraction: '.a-price .a-price-fraction' },
            // Other formats
            { whole: '.a-offscreen', fraction: '' }
          ];
          
          for (const selector of priceSelectors) {
            const priceWhole = $(element).find(selector.whole).first().text().trim();
            const priceFraction = selector.fraction ? $(element).find(selector.fraction).first().text().trim() : '00';
            
            if (priceWhole) {
              price = parseFloat((priceWhole.replace(/[^\d.]/g, '') || '0') + '.' + (priceFraction.replace(/[^\d.]/g, '') || '0'));
              break;
            }
          }
          
          // Original price (if discounted)
          const originalPriceSelectors = [
            '.a-text-price .a-offscreen',
            '.a-text-price',
            '.a-text-strike'
          ];
          
          for (const selector of originalPriceSelectors) {
            const originalPriceText = $(element).find(selector).first().text().trim();
            if (originalPriceText) {
              originalPrice = parseFloat(originalPriceText.replace(/[^\d.]/g, '') || '0');
              break;
            }
          }
          
          // Calculate discount percentage if both prices are available
          let discount: number | undefined;
          if (originalPrice && price && originalPrice > price) {
            discount = Math.round(((originalPrice - price) / originalPrice) * 100);
          }
          
          // Get image with different possible selectors
          const imageSelectors = ['img.s-image', '.s-image', 'img'];
          let image = '';
          
          for (const selector of imageSelectors) {
            image = $(element).find(selector).attr('src') || '';
            if (image) break;
          }
          
          // Get rating with different selectors
          const ratingSelectors = [
            '.a-icon-star-small',
            '.a-icon-star',
            '[data-component-type="s-product-rating"] .a-icon-alt'
          ];
          let rating: number | undefined;
          
          for (const selector of ratingSelectors) {
            const ratingText = $(element).find(selector).first().text().trim();
            if (ratingText) {
              // Parse rating text in different formats: "4.5 out of 5 stars", "4,5 من 5 نجوم", etc.
              const ratingMatch = ratingText.match(/(\d+[.,]?\d*)/);
              if (ratingMatch) {
                rating = parseFloat(ratingMatch[0].replace(',', '.'));
                break;
              }
            }
          }
          
          // Get review count with different selectors
          const reviewSelectors = [
            '.a-size-base.s-underline-text',
            '.a-link-normal .a-size-base',
            '[data-component-type="s-product-rating"] .a-size-base'
          ];
          let reviewCount: number | undefined;
          
          for (const selector of reviewSelectors) {
            const reviewText = $(element).find(selector).text().trim();
            if (reviewText) {
              const reviewMatch = reviewText.match(/(\d+[,\d]*)/);
              if (reviewMatch) {
                reviewCount = parseInt(reviewMatch[0].replace(/,/g, ''), 10);
                break;
              }
            }
          }
          
          // Check for sponsored/promotional with different selectors
          const promotionalSelectors = [
            '.s-sponsored-label-info-icon',
            '.s-sponsored-label',
            '.a-color-secondary:contains("Sponsored")',
            '.a-color-secondary:contains("مُدعم")'
          ];
          let isPromotional = false;
          
          for (const selector of promotionalSelectors) {
            if ($(element).find(selector).length > 0) {
              isPromotional = true;
              break;
            }
          }
          
          // Check for free delivery
          const deliveryTextSelectors = [
            '.a-color-success',
            '.a-color-base:contains("FREE")',
            '.a-color-base:contains("توصيل مجاني")'
          ];
          let isFreeDelivery = false;
          
          for (const selector of deliveryTextSelectors) {
            const deliveryText = $(element).find(selector).text();
            if (deliveryText && (deliveryText.includes('FREE') || deliveryText.includes('مجاني'))) {
              isFreeDelivery = true;
              break;
            }
          }
          
          // Extract brand if available
          const brandSelectors = [
            '.a-row.a-size-base.a-color-secondary .a-size-base.a-link-normal',
            '.a-row:contains("Brand") .a-link-normal',
            '.a-row:contains("العلامة التجارية") .a-link-normal'
          ];
          let brand: string | undefined;
          
          for (const selector of brandSelectors) {
            const brandElement = $(element).find(selector);
            if (brandElement.length) {
              brand = brandElement.text().trim();
              break;
            }
          }
          
          // Add product to results
          if (title && asin) {
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
          }
        } catch (e) {
          console.error('Error parsing Amazon product:', e);
        }
      });
      
      if (products.length === 0) {
        console.log('No products found with primary selectors. Trying alternative Amazon HTML structure...');
        
        // Try alternative HTML structure - sometimes Amazon has different layouts
        $('.s-result-item, .sg-col-4-of-12, .sg-col-4-of-16').each((i, element) => {
          if (products.length >= 20) return; // Limit to 20 products
          
          try {
            const asin = $(element).attr('data-asin') || '';
            if (!asin) return;
            
            // Extract product details from alternative structure
            const titleElement = $(element).find('h2, .a-text-normal').first();
            const title = titleElement.text().trim();
            const url = this.baseUrl + ($(element).find('a.a-link-normal').attr('href') || `/dp/${asin}`);
            
            // Find price - try multiple different selectors
            let price = 0;
            const priceText = $(element).find('.a-price, .a-color-price').text().trim();
            if (priceText) {
              price = parseFloat(priceText.replace(/[^\d.]/g, '') || '0');
            }
            
            // Get image
            const image = $(element).find('img').attr('src') || '';
            
            // Add product to results
            if (title && asin) {
              products.push({
                id: `amazon-${asin}`,
                title,
                price,
                platform: 'amazon',
                image,
                url,
                isBestPrice: false
              });
            }
          } catch (e) {
            console.error('Error parsing alternative Amazon product:', e);
          }
        });
      }
      
      console.log(`Found ${products.length} products from Amazon search`);
      return products;
    } catch (error) {
      console.error('Error parsing Amazon search results:', error);
      return []; // Return empty array instead of mock data
    }
  }
  
  /**
   * Parse product details page
   */
  private parseProductDetails(html: string, asin: string): Product | null {
    try {
      const $ = cheerio.load(html);
      
      // Check if we're getting a captcha page
      if (html.includes('captcha') || html.includes('CAPTCHA') || html.includes('To discuss automated access to Amazon data please contact')) {
        console.log('Amazon returned a CAPTCHA page for product details. Cannot proceed with scraping.');
        return null;
      }
      
      // Try to extract JSON data first - Amazon often embeds product data in JSON
      try {
        // Look for the embedded product data script
        const scripts = $('script').toArray();
        for (const script of scripts) {
          const scriptContent = $(script).html() || '';
          
          // Look for product data patterns
          if (scriptContent.includes('"product":') || 
              scriptContent.includes('"asin":"' + asin) || 
              scriptContent.includes('"productDetails":')) {
            try {
              // Try to extract the JSON from the script
              const matches = scriptContent.match(/({.+})/g);
              if (matches) {
                for (const match of matches) {
                  try {
                    const jsonData = JSON.parse(match);
                    
                    // Check if this contains product data
                    const productData = jsonData.product || jsonData.productDetails || 
                                        (jsonData.props?.pageProps?.product) ||
                                        jsonData;
                    
                    if (productData && (productData.asin === asin || productData.asin)) {
                      const title = productData.title || productData.name || '';
                      const price = parseFloat(productData.price?.amount || productData.price || '0');
                      const image = productData.image || productData.mainImage?.url || '';
                      
                      // Build the product object from the JSON data
                      return {
                        id: `amazon-${asin}`,
                        title,
                        price,
                        originalPrice: productData.originalPrice ? parseFloat(productData.originalPrice) : undefined,
                        discount: productData.discount || undefined,
                        image,
                        url: `${this.baseUrl}/dp/${asin}`,
                        platform: 'amazon',
                        rating: productData.rating || undefined,
                        reviewCount: productData.reviewCount || undefined,
                        description: productData.description || '',
                        isFreeDelivery: productData.isFreeDelivery || false,
                        isPromotional: false,
                        brand: productData.brand || undefined,
                        specs: productData.specs || productData.technicalDetails || [],
                        isBestPrice: false
                      };
                    }
                  } catch (e) {
                    // Continue to next match
                  }
                }
              }
            } catch (e) {
              // Continue to next script
            }
          }
        }
      } catch (e) {
        console.error('Error extracting Amazon product JSON data:', e);
      }
      
      console.log('Falling back to HTML parsing for Amazon product details');
      
      // Extract product title with multiple selectors
      const titleSelectors = ['#productTitle', '.product-title', 'h1.a-size-large'];
      let title = '';
      
      for (const selector of titleSelectors) {
        title = $(selector).text().trim();
        if (title) break;
      }
      
      if (!title) {
        console.log('Could not find product title for Amazon product');
        return null;
      }
      
      // Extract current price with multiple selectors
      let price = 0;
      const priceSelectors = [
        '.a-price .a-offscreen',
        '.a-color-price',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '.offer-price'
      ];
      
      for (const selector of priceSelectors) {
        const priceElement = $(selector).first();
        if (priceElement.length) {
          const priceText = priceElement.text().trim();
          price = parseFloat(priceText.replace(/[^\d.]/g, '') || '0');
          if (price > 0) break;
        }
      }
      
      // Extract original price if discounted
      let originalPrice: number | undefined;
      const originalPriceSelectors = [
        '.a-text-price .a-offscreen',
        '.a-text-price',
        '.a-text-strike',
        '#priceblock_listprice',
        '.priceBlockStrikePriceString'
      ];
      
      for (const selector of originalPriceSelectors) {
        const originalPriceElement = $(selector).first();
        if (originalPriceElement.length) {
          const originalPriceText = originalPriceElement.text().trim();
          originalPrice = parseFloat(originalPriceText.replace(/[^\d.]/g, '') || '0');
          if (originalPrice > 0) break;
        }
      }
      
      // Calculate discount
      let discount: number | undefined;
      if (originalPrice && price && originalPrice > price) {
        discount = Math.round(((originalPrice - price) / originalPrice) * 100);
      }
      
      // Extract product image with multiple selectors
      const imageSelectors = [
        '#landingImage',
        '#imgBlkFront',
        '#main-image',
        '.a-dynamic-image'
      ];
      let image = '';
      
      for (const selector of imageSelectors) {
        image = $(selector).attr('src') || $(selector).attr('data-a-dynamic-image') || '';
        if (image) {
          // Sometimes the image is in a JSON string in data-a-dynamic-image
          if (image.startsWith('{') && image.includes('http')) {
            try {
              const imageJson = JSON.parse(image);
              image = Object.keys(imageJson)[0] || '';
            } catch (e) {
              // Keep the original value
            }
          }
          
          if (image) break;
        }
      }
      
      // If no image found, try any img tag
      if (!image) {
        image = $('img').first().attr('src') || '';
      }
      
      // Extract product description with multiple selectors
      const descriptionSelectors = [
        '#productDescription p',
        '#feature-bullets li',
        '.a-expander-content p',
        '#aplus p'
      ];
      let description = '';
      
      for (const selector of descriptionSelectors) {
        const descText = $(selector).text().trim();
        if (descText) {
          description += descText + ' ';
        }
      }
      description = description.trim();
      
      // Extract product rating with multiple selectors
      let rating: number | undefined;
      const ratingSelectors = [
        '#acrPopover',
        '.a-icon-star',
        '.reviewCountTextLinkedHistogram',
        '[data-hook="rating-out-of-text"]'
      ];
      
      for (const selector of ratingSelectors) {
        const ratingElement = $(selector);
        const ratingText = ratingElement.attr('title') || ratingElement.text().trim();
        if (ratingText) {
          const ratingMatch = ratingText.match(/(\d+[.,]?\d*)/);
          if (ratingMatch) {
            rating = parseFloat(ratingMatch[0].replace(',', '.'));
            break;
          }
        }
      }
      
      // Extract review count with multiple selectors
      let reviewCount: number | undefined;
      const reviewSelectors = [
        '#acrCustomerReviewText',
        '#ratings-count',
        '[data-hook="total-review-count"]'
      ];
      
      for (const selector of reviewSelectors) {
        const reviewText = $(selector).text().trim();
        if (reviewText) {
          const reviewMatch = reviewText.match(/(\d+[,\d]*)/);
          if (reviewMatch) {
            reviewCount = parseInt(reviewMatch[0].replace(/,/g, ''), 10);
            break;
          }
        }
      }
      
      // Check for free delivery with multiple selectors
      const deliverySelectors = [
        '#deliveryMessageMirId',
        '#deliveryBlockMessage',
        '.a-color-success:contains("FREE")',
        '.a-color-success:contains("مجاني")'
      ];
      let isFreeDelivery = false;
      
      for (const selector of deliverySelectors) {
        const deliveryText = $(selector).text().trim();
        if (deliveryText && (deliveryText.includes('FREE') || deliveryText.includes('مجاني'))) {
          isFreeDelivery = true;
          break;
        }
      }
      
      // Extract brand with multiple selectors
      const brandSelectors = [
        '#bylineInfo',
        '.po-brand .a-span9',
        '.a-section:contains("Brand") .a-span9',
        '.a-section:contains("العلامة التجارية") .a-span9'
      ];
      let brand = '';
      
      for (const selector of brandSelectors) {
        brand = $(selector).text().trim()
                .replace('Brand: ', '')
                .replace('العلامة التجارية: ', '')
                .replace('Visit the ', '')
                .replace(' Store', '');
        if (brand) break;
      }
      
      // Extract specifications
      const specs: { key: string, value: string }[] = [];
      
      // Try different tables for specs
      const specSelectors = [
        '.a-section.a-spacing-small.a-spacing-top-small tr',
        '.a-keyvalue tr',
        '#productDetails_techSpec_section_1 tr',
        '#productDetails_techSpec_section_2 tr',
        '#productDetailsTable .content li',
        '.detail-bullet-list li'
      ];
      
      for (const selector of specSelectors) {
        $(selector).each((i, row) => {
          let key = '';
          let value = '';
          
          if ($(row).find('th').length && $(row).find('td').length) {
            // Standard table format with th and td
            key = $(row).find('th').text().trim();
            value = $(row).find('td').text().trim();
          } else if ($(row).find('.label').length && $(row).find('.value').length) {
            // Alternative format with label and value classes
            key = $(row).find('.label').text().trim();
            value = $(row).find('.value').text().trim();
          } else if ($(row).find('.a-span3').length && $(row).find('.a-span9').length) {
            // Alternative Amazon format with span classes
            key = $(row).find('.a-span3').text().trim();
            value = $(row).find('.a-span9').text().trim();
          } else {
            // List format (e.g., for bullet lists)
            const text = $(row).text().trim();
            const parts = text.split(':');
            if (parts.length >= 2) {
              key = parts[0].trim();
              value = parts.slice(1).join(':').trim();
            }
          }
          
          if (key && value) {
            // Avoid duplicates
            if (!specs.some(spec => spec.key === key)) {
              specs.push({ key, value });
            }
          }
        });
        
        // If we found some specs, break
        if (specs.length > 0) break;
      }
      
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
        brand: brand || undefined,
        specs,
        isBestPrice: false
      };
    } catch (error) {
      console.error(`Error parsing Amazon product details for ${asin}:`, error);
      return null; // Return null instead of mock data
    }
  }
  

}
