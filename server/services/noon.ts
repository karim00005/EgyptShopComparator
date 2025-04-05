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
      
      // First, try to use the Noon API directly
      try {
        // This API endpoint appears to be public and doesn't require authentication
        const apiUrl = `${this.baseUrl}/egypt-ar/searchapi/v3/autocomplete/?q=${encodedQuery}&lang=ar`;
        const apiResponse = await axios.get(apiUrl, {
          headers: {
            ...this.headers,
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
            'Referer': 'https://www.noon.com/egypt-ar/',
            'X-Locale': 'ar-eg',
            'X-Platform': 'web'
          },
          timeout: 10000
        });
        
        if (apiResponse.status === 200 && apiResponse.data && apiResponse.data.hits) {
          console.log(`Successfully used Noon API, found ${apiResponse.data.hits.length} products`);
          return this.parseJsonSearchResults(apiResponse.data, query);
        }
      } catch (apiError) {
        console.log('Noon API search failed, falling back to HTML scraping');
      }
      
      // Next, try a different API endpoint that might work
      try {
        const searchApiUrl = `${this.baseUrl}/egypt-ar/nlpapi/suggestion?q=${encodedQuery}&lang=ar`;
        const suggestResponse = await axios.get(searchApiUrl, {
          headers: {
            ...this.headers,
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
            'Referer': 'https://www.noon.com/egypt-ar/'
          },
          timeout: 10000
        });
        
        if (suggestResponse.status === 200 && suggestResponse.data && suggestResponse.data.suggestions) {
          console.log('Found suggestions from Noon API, trying first suggestion');
          
          // Use the first suggestion to get product results
          if (suggestResponse.data.suggestions.length > 0) {
            const suggestion = suggestResponse.data.suggestions[0].text;
            const suggestApiUrl = `${this.baseUrl}/egypt-ar/catalog-api/v2/search/products?q=${encodeURIComponent(suggestion)}&lang=ar`;
            
            const productResponse = await axios.get(suggestApiUrl, {
              headers: {
                ...this.headers,
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
                'Referer': 'https://www.noon.com/egypt-ar/'
              },
              timeout: 10000
            });
            
            if (productResponse.status === 200 && productResponse.data && productResponse.data.hits) {
              console.log(`Successfully used Noon suggestion API, found ${productResponse.data.hits.length} products`);
              return this.parseJsonSearchResults(productResponse.data, query);
            }
          }
        }
      } catch (suggestError) {
        console.log('Noon suggestion API failed, continuing to HTML scraping');
      }
      
      // If API methods fail, try standard HTML scraping
      // Try the direct search URL which returns HTML with embedded JSON data
      const directUrl = `${this.searchUrl}/?q=${encodedQuery}`;
      
      console.log(`Making request to Noon search URL: ${directUrl}`);
      
      try {
        // Use enhanced browser-like headers that mimic a real browser more closely
        const response = await axios.get(directUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive',
            'Referer': 'https://www.noon.com/egypt-ar/',
            'Sec-Ch-Ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'Priority': 'u=0, i'
          },
          timeout: 20000, // Longer timeout for HTML response
          maxRedirects: 5
        });
        
        if (response.status === 200) {
          console.log('Successfully got Noon HTML response, extracting products');
          
          // First try to extract JSON data from HTML - Look for all script tags
          try {
            const html = response.data;
            console.log('Scanning Noon HTML for product data...');
            
            // Try to find either __NEXT_DATA__ or window.__INITIAL_DATA__
            let dataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
            if (dataMatch && dataMatch[1]) {
              console.log('Found __NEXT_DATA__ script');
              try {
                const jsonData = JSON.parse(dataMatch[1]);
                
                // Check various paths where products might be stored
                if (jsonData.props?.pageProps?.searchResult?.hits) {
                  console.log(`Found ${jsonData.props.pageProps.searchResult.hits.length} products in __NEXT_DATA__`);
                  return this.parseJsonSearchResults(jsonData.props.pageProps.searchResult, query);
                } else if (jsonData.props?.pageProps?.initialReduxState?.searchResult?.hits) {
                  console.log(`Found ${jsonData.props.pageProps.initialReduxState.searchResult.hits.length} products in initialReduxState`);
                  return this.parseJsonSearchResults(jsonData.props.pageProps.initialReduxState.searchResult, query);
                } else if (jsonData.props?.pageProps?.catalog?.products) {
                  console.log(`Found ${jsonData.props.pageProps.catalog.products.length} products in catalog`);
                  return this.parseJsonSearchResults({hits: jsonData.props.pageProps.catalog.products}, query);
                }
              } catch (e) {
                console.log('Failed to parse __NEXT_DATA__ JSON:', e);
              }
            }
            
            // Try window.__INITIAL_DATA__ if __NEXT_DATA__ fails
            dataMatch = html.match(/window\.__INITIAL_DATA__\s*=\s*({[\s\S]*?});/);
            if (dataMatch && dataMatch[1]) {
              console.log('Found window.__INITIAL_DATA__ script');
              try {
                const jsonData = JSON.parse(dataMatch[1]);
                
                if (jsonData.searchResult?.hits) {
                  console.log(`Found ${jsonData.searchResult.hits.length} products in __INITIAL_DATA__`);
                  return this.parseJsonSearchResults(jsonData.searchResult, query);
                } else if (jsonData.catalog?.products) {
                  console.log(`Found ${jsonData.catalog.products.length} products in catalog`);
                  return this.parseJsonSearchResults({hits: jsonData.catalog.products}, query);
                }
              } catch (e) {
                console.log('Failed to parse __INITIAL_DATA__ JSON:', e);
              }
            }
            
            // If both special scripts fail, try scanning all script tags
            const scriptTags = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
            console.log(`Found ${scriptTags.length} script tags in Noon response`);
            
            for (const scriptTag of scriptTags) {
              try {
                if (scriptTag.includes('"products":') || 
                    scriptTag.includes('"hits":') || 
                    scriptTag.includes('"searchResult":')) {
                  
                  console.log('Found potential product data script');
                  
                  // Try to extract JSON from the script
                  const jsonMatch = scriptTag.match(/({[\s\S]*})/);
                  if (jsonMatch) {
                    const jsonData = JSON.parse(jsonMatch[1]);
                    
                    if (jsonData.hits && Array.isArray(jsonData.hits)) {
                      console.log(`Found ${jsonData.hits.length} products in script tag JSON`);
                      return this.parseJsonSearchResults(jsonData, query);
                    } else if (jsonData.products && Array.isArray(jsonData.products)) {
                      console.log(`Found ${jsonData.products.length} products in script tag JSON`);
                      return this.parseJsonSearchResults({hits: jsonData.products}, query);
                    } else if (jsonData.searchResult?.hits) {
                      console.log(`Found ${jsonData.searchResult.hits.length} products in searchResult`);
                      return this.parseJsonSearchResults(jsonData.searchResult, query);
                    }
                  }
                }
              } catch (e) {
                // Continue to next script tag
              }
            }
            
            console.log('Could not extract product data from scripts, falling back to HTML parsing');
          } catch (jsonError) {
            console.log('Failed to extract JSON data from HTML, falling back to HTML parsing');
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
      return []; // Return empty array
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
      
      // Look for embedded JSON data first - this is more reliable than HTML scraping
      // Try to find the script containing product data
      let jsonDataFound = false;
      
      // Check for searchPageProps which often contains the search results
      const searchPageProps = html.match(/window\.__SEARCH_PAGE_PROPS__\s*=\s*({.+?});/);
      if (searchPageProps && searchPageProps[1]) {
        try {
          const data = JSON.parse(searchPageProps[1]);
          if (data.hits && Array.isArray(data.hits) && data.hits.length > 0) {
            console.log(`Found ${data.hits.length} products in __SEARCH_PAGE_PROPS__`);
            const parsedProducts = this.parseJsonSearchResults(data, query);
            if (parsedProducts.length > 0) {
              jsonDataFound = true;
              return parsedProducts;
            }
          }
        } catch (e) {
          console.log('Failed to parse __SEARCH_PAGE_PROPS__:', e);
        }
      }

      // Try to find product data in script tags with common JSON patterns
      if (!jsonDataFound) {
        const scriptTags = html.match(/<script[^>]*>([^<]+)<\/script>/g);
        if (scriptTags) {
          for (const script of scriptTags) {
            try {
              // Look for JSON objects that likely contain product data
              const jsonMatch = script.match(/\{.+?"products"\s*:\s*\[.+?\]/) || 
                              script.match(/\{.+?"hits"\s*:\s*\[.+?\]/) || 
                              script.match(/\{.+?"searchResult"\s*:\s*\{.+?\}/);
              
              if (jsonMatch) {
                const jsonData = JSON.parse(jsonMatch[0]);
                if (jsonData.products && Array.isArray(jsonData.products) && jsonData.products.length > 0) {
                  console.log(`Found ${jsonData.products.length} products in script JSON`);
                  const parsedProducts = this.parseJsonSearchResults({hits: jsonData.products}, query);
                  if (parsedProducts.length > 0) {
                    jsonDataFound = true;
                    return parsedProducts;
                  }
                } else if (jsonData.hits && Array.isArray(jsonData.hits) && jsonData.hits.length > 0) {
                  console.log(`Found ${jsonData.hits.length} hits in script JSON`);
                  const parsedProducts = this.parseJsonSearchResults(jsonData, query);
                  if (parsedProducts.length > 0) {
                    jsonDataFound = true;
                    return parsedProducts;
                  }
                } else if (jsonData.searchResult && jsonData.searchResult.hits) {
                  console.log(`Found ${jsonData.searchResult.hits.length} products in searchResult`);
                  const parsedProducts = this.parseJsonSearchResults(jsonData.searchResult, query);
                  if (parsedProducts.length > 0) {
                    jsonDataFound = true;
                    return parsedProducts;
                  }
                }
              }
            } catch (e) {
              // Continue to next script tag
            }
          }
        }
      }
      
      if (!jsonDataFound) {
        console.log('No valid JSON data found, falling back to HTML parsing');
      }
      
      // Enhanced HTML parsing approach
      // Check for modern Noon layout which uses data-component and data-qa attributes
      const modernProductContainers = $('[data-component="product"], [data-qa="product-block"], [data-qa="collection-item"]');
      if (modernProductContainers.length > 0) {
        console.log(`Found ${modernProductContainers.length} modern product containers`);
        
        modernProductContainers.each((i, element) => {
          if (products.length >= 20) return false;
          
          try {
            // Find product link
            const linkElement = $(element).find('a[href*="/product/"]');
            if (!linkElement.length) return;
            
            const href = linkElement.attr('href') || '';
            const productId = href.split('/').pop() || '';
            
            if (!productId) return;
            
            // Extract title
            const titleElement = $(element).find('[data-qa="product-name"], .productTitle, h3, h2, .title');
            const title = titleElement.length ? titleElement.text().trim() : '';
            
            // URL
            const url = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
            
            // Price
            let price = 0;
            let priceText = '';
            const newPriceElement = $(element).find('[data-qa="price"], [data-qa="new-price"], .price');
            
            if (newPriceElement.length) {
              priceText = newPriceElement.text().trim();
              price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;
            }
            
            // Original price
            let originalPrice: number | undefined;
            const oldPriceElement = $(element).find('[data-qa="old-price"], .oldPrice');
            if (oldPriceElement.length) {
              const oldPriceText = oldPriceElement.text().trim();
              originalPrice = parseFloat(oldPriceText.replace(/[^\d.]/g, '')) || undefined;
            }
            
            // Discount
            let discount: number | undefined;
            if (originalPrice && price && originalPrice > price) {
              discount = Math.round(((originalPrice - price) / originalPrice) * 100);
            } else {
              const discountElement = $(element).find('[data-qa="discount-badge"], .discount-badge');
              if (discountElement.length) {
                const discountText = discountElement.text().trim();
                discount = parseInt(discountText.replace(/[^\d]/g, ''), 10) || undefined;
              }
            }
            
            // Image
            let image = '';
            const imgElement = $(element).find('img');
            if (imgElement.length) {
              // Try various image attributes
              image = imgElement.attr('src') || 
                     imgElement.attr('data-src') || 
                     imgElement.attr('data-original') || 
                     imgElement.attr('data-lazy-src') || '';
            }
            
            // If no image found but we have a productId, construct a noon CDN URL
            if ((!image || image.includes('data:image')) && productId) {
              image = `https://k.nooncdn.com/t_desktop-thumbnail-v2/${productId}.jpg`;
            }
            
            // Rating
            let rating: number | undefined;
            const ratingElement = $(element).find('[data-qa="rating"], .rating');
            if (ratingElement.length) {
              const ratingText = ratingElement.text().trim();
              rating = parseFloat(ratingText) || undefined;
            }
            
            // Brand
            const brandElement = $(element).find('[data-qa="brand-name"], .brand');
            const brand = brandElement.length ? brandElement.text().trim() : 'Noon';
            
            console.log(`Found Noon product: ${title} at ${price} EGP`);
            
            products.push({
              id: `noon-${productId}`,
              title: title || `Noon Product ${productId}`,
              price,
              originalPrice,
              discount,
              image,
              url,
              platform: 'noon',
              rating,
              brand,
              isFreeDelivery: $(element).find('[data-qa="free-shipping"], .freeDelivery').length > 0,
              isPromotional: discount !== undefined,
              isBestPrice: false
            });
          } catch (e) {
            console.error('Error parsing Noon product:', e);
          }
        });
      }
      
      // If no products found, try another approach with product cards and grids
      if (products.length === 0) {
        // Look for product grids and product items
        const productItems = $('.productContainer, .productCard, .product-card, .product-item, [data-testid="product-card"]');
        console.log(`Found ${productItems.length} product items`);
        
        productItems.each((i, element) => {
          if (products.length >= 20) return false;
          
          try {
            // Find link with product ID
            const link = $(element).find('a[href*="/product/"]');
            if (!link.length) return;
            
            const href = link.attr('href') || '';
            const productId = href.split('/').pop() || '';
            
            if (!productId) return;
            
            // Find title
            let title = '';
            const possibleTitleElements = [
              $(element).find('h1, h2, h3, h4, .title, .name, .productTitle'),
              link.find('.title, .name'),
              link
            ];
            
            for (const el of possibleTitleElements) {
              if (el.length) {
                title = el.text().trim();
                if (title) break;
                title = el.attr('title') || '';
                if (title) break;
              }
            }
            
            // Price
            let price = 0;
            const priceElement = $(element).find('.price, [class*="price"], [data-testid="price"]');
            if (priceElement.length) {
              const priceText = priceElement.text().trim();
              price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;
            }
            
            // Image
            let image = '';
            const img = $(element).find('img');
            if (img.length) {
              image = img.attr('src') || img.attr('data-src') || '';
            }
            
            // Construct noon CDN URL for missing image
            if ((!image || image.includes('data:image')) && productId) {
              image = `https://k.nooncdn.com/t_desktop-thumbnail-v2/${productId}.jpg`;
            }
            
            // URL
            const url = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
            
            products.push({
              id: `noon-${productId}`,
              title: title || `Noon Product ${productId}`,
              price,
              image,
              url,
              platform: 'noon',
              isBestPrice: false
            });
          } catch (e) {
            console.error('Error parsing Noon product card:', e);
          }
        });
      }
      
      // Last resort: search for all product links in the page
      if (products.length === 0) {
        const allProductLinks = $('a[href*="/product/"]');
        console.log(`Found ${allProductLinks.length} raw product links`);
        
        const processedIds = new Set();
        
        allProductLinks.each((i, element) => {
          if (products.length >= 20) return false;
          
          try {
            const href = $(element).attr('href') || '';
            const productId = href.split('/').pop() || '';
            
            if (!productId || processedIds.has(productId)) return;
            processedIds.add(productId);
            
            // URL
            const url = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
            
            // Title
            let title = $(element).text().trim() || $(element).attr('title') || '';
            if (!title) {
              // Try to find title in parent elements
              const parentText = $(element).parent().text().trim();
              if (parentText && parentText.length < 100) {
                title = parentText;
              }
            }
            
            // Construct a product with minimal information
            products.push({
              id: `noon-${productId}`,
              title: title || `Noon Product ${productId}`,
              price: 0, // We don't have price information at this level
              image: `https://k.nooncdn.com/t_desktop-thumbnail-v2/${productId}.jpg`,
              url,
              platform: 'noon',
              isBestPrice: false
            });
          } catch (e) {
            console.error('Error processing raw Noon product link:', e);
          }
        });
      }
      
      console.log(`Found ${products.length} Noon products`);
      return products;
    } catch (error) {
      console.error('Error parsing Noon search results:', error);
      return []; // Return empty array
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
  

}
