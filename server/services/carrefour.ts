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
      
      // Encode query for Arabic support 
      const encodedQuery = encodeURIComponent(query);
      
      // Create a list of products to return
      let products: Product[] = [];
      
      // Try various API endpoints until one works
      
      // 1. Try the search-results API endpoint first
      const searchUrl = `https://www.carrefouregypt.com/api/v1/catalog/products/search-results?p=1&q=${encodedQuery}&lang=ar&displaySize=20&storeId=5`;
      
      console.log(`Making request to Carrefour search API URL: ${searchUrl}`);
      
      try {
        // Make the request with browser-like headers
        const response = await axios.get(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            'Referer': 'https://www.carrefouregypt.com/',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive'
          },
          timeout: 15000 // 15 second timeout
        });
        
        if (response.status === 200 && response.data) {
          console.log('Successfully got response from Carrefour search API');
          console.log('Carrefour API data structure:', JSON.stringify(response.data).substring(0, 500));
          
          if (response.data.results && Array.isArray(response.data.results) && response.data.results.length > 0) {
            console.log(`Found ${response.data.results.length} products in Carrefour API response`);
            const apiProducts = this.processCarrefourApiResults(response.data.results);
            if (apiProducts.length > 0) {
              return apiProducts;
            }
          }
        }
      } catch (searchApiError) {
        console.error('Error using Carrefour search API:', searchApiError);
      }
      
      // 2. Try the category API as an alternative
      const categoryUrl = `https://www.carrefouregypt.com/api/v1/catalog/categories/search-page?p=1&q=${encodedQuery}&lang=ar&displaySize=30&storeId=5`;
      
      console.log(`Making request to Carrefour category API URL: ${categoryUrl}`);
      
      try {
        // Make the request with browser-like headers
        const response = await axios.get(categoryUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            'Referer': 'https://www.carrefouregypt.com/',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive'
          },
          timeout: 15000 // 15 second timeout
        });
        
        if (response.status === 200 && response.data) {
          console.log('Successfully got response from Carrefour category API');
          console.log('Carrefour category API data structure:', JSON.stringify(response.data).substring(0, 500));
          
          if (response.data.products && Array.isArray(response.data.products) && response.data.products.length > 0) {
            console.log(`Found ${response.data.products.length} products in Carrefour category API response`);
            const apiProducts = this.processCarrefourApiResults(response.data.products);
            if (apiProducts.length > 0) {
              return apiProducts;
            }
          }
        }
      } catch (categoryApiError) {
        console.error('Error using Carrefour category API:', categoryApiError);
      }
      
      // 3. If API approaches failed, fallback to HTML scraping
      const htmlUrl = `https://www.carrefouregypt.com/mafegy/ar/v4/search?keyword=${encodedQuery}`;
      
      console.log(`Making request to Carrefour HTML URL: ${htmlUrl}`);
      
      try {
        // Make the request with browser-like headers
        const response = await axios.get(htmlUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            'Referer': 'https://www.carrefouregypt.com/',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          timeout: 15000, // 15 second timeout
          maxContentLength: 10 * 1024 * 1024 // 10MB max response size
        });
        
        // Debug response status
        console.log(`Carrefour HTML response status: ${response.status}`);
        console.log(`Carrefour HTML response size: ${response.data ? (response.data.length || 0) : 0} characters`);
        
        // If we got a response, parse it
        if (response.status === 200) {
          return this.parseSearchResults(response.data, query);
        }
      } catch (htmlError) {
        console.error('Error making request to Carrefour HTML page:', htmlError);
      }
      
      // If all approaches failed, return empty array
      console.log('All approaches to fetch Carrefour products failed');
      return [];
    } catch (error: any) {
      console.error('Error searching Carrefour Egypt:', error);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response headers:`, error.response.headers);
      }
      return []; // Return empty array
    }
  }
  
  /**
   * Process API results from Carrefour into Product objects
   */
  private processCarrefourApiResults(items: any[]): Product[] {
    const products: Product[] = [];
    
    // Process each product
    for (const item of items) {
      if (products.length >= 20) break;
      
      try {
        // Skip products without ID or name
        if (!item.id || !item.name) continue;
        
        // Extract product info
        const id = item.id;
        const title = item.name;
        
        // Handle price formats
        let price = 0;
        if (typeof item.price === 'number') {
          price = item.price;
        } else if (item.price?.current) {
          price = parseFloat(item.price.current);
        } else if (item.price?.value) {
          price = parseFloat(item.price.value);
        }
        
        // Handle original price
        let originalPrice: number | undefined;
        if (item.price?.was && parseFloat(item.price.was) > price) {
          originalPrice = parseFloat(item.price.was);
        }
        
        // Calculate discount
        let discount: number | undefined;
        if (originalPrice && price && originalPrice > price) {
          discount = Math.round(((originalPrice - price) / originalPrice) * 100);
        } else if (item.discount || item.discountPercentage) {
          discount = parseFloat(item.discount || item.discountPercentage);
        }
        
        // Handle images
        let image = '';
        if (item.image) {
          image = typeof item.image === 'string' ? item.image : item.image.url || '';
        } else if (item.images && item.images.length > 0) {
          if (typeof item.images[0] === 'string') {
            image = item.images[0];
          } else {
            image = item.images[0].url || '';
          }
        }
        
        // Ensure image URL is absolute
        if (image && !image.startsWith('http')) {
          image = `https://www.carrefouregypt.com${image.startsWith('/') ? '' : '/'}${image}`;
        }
        
        // Fix image URL if needed for CDN
        if (image.includes('cdn.mafrservices.com') && !image.includes('?im=')) {
          image = `${image}?im=Resize=400`;
        }
        
        // Create product URL
        const url = `https://www.carrefouregypt.com/mafegy/ar/products/${id}`;
        
        // Extract additional info
        const brand = item.brand || '';
        const isFreeDelivery = !!item.freeDelivery || !!item.freeShipping;
        const isPromotional = discount !== undefined && discount > 0;
        
        products.push({
          id: `carrefour-${id}`,
          title,
          price,
          originalPrice,
          discount,
          image,
          url,
          platform: 'carrefour',
          brand,
          isFreeDelivery,
          isPromotional,
          isBestPrice: false
        });
        
      } catch (productError) {
        console.error('Error processing Carrefour API product:', productError);
      }
    }
    
    // Return the products we found
    if (products.length > 0) {
      console.log(`Processed ${products.length} Carrefour products from API`);
    }
    
    return products;
  }
  
  /**
   * Get detailed product information
   */
  async getProductDetails(productId: string): Promise<Product | null> {
    try {
      console.log(`Fetching Carrefour Egypt product details for: ${productId}`);
      
      // Extract the product code if it's a full URL
      const productCode = productId.includes('/product/') ? 
        productId.split('/product/')[1].split('/')[0] : 
        productId;
      
      // Try the direct API first (more reliable)
      const apiUrl = `https://www.carrefouregypt.com/api/v1/catalog/products/${productCode}?lang=ar&storeId=5`;
      
      console.log(`Making request to Carrefour product API URL: ${apiUrl}`);
      
      try {
        // Make the request with browser-like headers
        const response = await axios.get(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            'Referer': 'https://www.carrefouregypt.com/',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive'
          },
          timeout: 10000 // 10 second timeout
        });
        
        if (response.status === 200 && response.data) {
          console.log('Successfully got response from Carrefour product API');
          
          try {
            const item = response.data;
            
            // Skip products without necessary fields
            if (!item.id || !item.name) {
              throw new Error('Product API response missing required fields');
            }
            
            // Extract product info
            const id = item.id;
            const title = item.name;
            
            // Handle price formats
            let price = 0;
            if (typeof item.price === 'number') {
              price = item.price;
            } else if (item.price?.current) {
              price = parseFloat(item.price.current);
            } else if (item.price?.value) {
              price = parseFloat(item.price.value);
            }
            
            // Handle original price
            let originalPrice: number | undefined;
            if (item.price?.was && parseFloat(item.price.was) > price) {
              originalPrice = parseFloat(item.price.was);
            }
            
            // Calculate discount
            let discount: number | undefined;
            if (originalPrice && price && originalPrice > price) {
              discount = Math.round(((originalPrice - price) / originalPrice) * 100);
            } else if (item.discount || item.discountPercentage) {
              discount = parseFloat(item.discount || item.discountPercentage);
            }
            
            // Handle images
            let image = '';
            if (item.images && item.images.length > 0) {
              if (typeof item.images[0] === 'string') {
                image = item.images[0];
              } else {
                image = item.images[0].url || '';
              }
            }
            
            // Ensure image URL is absolute
            if (image && !image.startsWith('http')) {
              image = `https://www.carrefouregypt.com${image.startsWith('/') ? '' : '/'}${image}`;
            }
            
            // Fix image URL for CDN
            if (image.includes('cdn.mafrservices.com') && !image.includes('?im=')) {
              image = `${image}?im=Resize=400`;
            }
            
            // Create product URL
            const url = `https://www.carrefouregypt.com/mafegy/ar/products/${id}`;
            
            // Extract additional info
            const brand = item.brand || '';
            const description = item.description || '';
            const specs = (item.attributes || []).map((attr: any) => ({
              key: attr.name || '',
              value: attr.value || ''
            }));
            
            const isFreeDelivery = !!item.freeDelivery || !!item.freeShipping;
            const isPromotional = discount !== undefined && discount > 0;
            
            return {
              id: `carrefour-${id}`,
              title,
              price,
              originalPrice,
              discount,
              image,
              url,
              platform: 'carrefour',
              brand,
              description,
              specs,
              isFreeDelivery,
              isPromotional,
              isBestPrice: false
            };
            
          } catch (parseError) {
            console.error('Error parsing Carrefour product API response:', parseError);
          }
        }
      } catch (apiError) {
        console.error('Error using Carrefour product API:', apiError);
      }
      
      // Fallback to HTML parsing if API fails
      const htmlUrl = `https://www.carrefouregypt.com/mafegy/ar/products/${productCode}`;
      
      console.log(`Making request to Carrefour product HTML URL: ${htmlUrl}`);
      
      try {
        // Make the request with browser-like headers
        const response = await axios.get(htmlUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            'Referer': 'https://www.carrefouregypt.com/',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          timeout: 10000, // 10 second timeout
          maxContentLength: 10 * 1024 * 1024 // 10MB max response size
        });
        
        // Debug response status
        console.log(`Carrefour product HTML response status: ${response.status}`);
        console.log(`Carrefour product HTML response size: ${response.data ? (response.data.length || 0) : 0} characters`);
        
        // If we got a response, parse it
        if (response.status === 200) {
          return this.parseProductDetails(response.data, productCode);
        }
      } catch (htmlError) {
        console.error('Error making request to Carrefour product HTML page:', htmlError);
      }
      
      return null;
    } catch (error: any) {
      console.error(`Error fetching Carrefour Egypt product ${productId}:`, error);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response headers:`, error.response.headers);
      }
      return null;
    }
  }
  
  /**
   * Parse Carrefour search results page
   */
  private parseSearchResults(html: string, query: string): Product[] {
    try {
      const $ = cheerio.load(html);
      const products: Product[] = [];
      
      console.log('Parsing Carrefour HTML search results...');
      
      // First try to extract product data from embedded JSON
      try {
        // Look for JSON data in script tags
        let jsonData = null;
        
        // The data is often in a script with window.__INITIAL_STATE__
        const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/);
        if (stateMatch && stateMatch[1]) {
          try {
            const state = JSON.parse(stateMatch[1]);
            // Check various paths where product data might be located
            if (state.search && state.search.products) {
              jsonData = state.search.products;
              console.log(`Found ${jsonData.length} products in __INITIAL_STATE__`);
            } else if (state.catalog && state.catalog.products) {
              jsonData = state.catalog.products;
              console.log(`Found ${jsonData.length} products in catalog state`);
            } else if (state.plp && state.plp.items) {
              jsonData = state.plp.items;
              console.log(`Found ${jsonData.length} products in plp state`);
            }
          } catch (e) {
            console.log('Failed to parse __INITIAL_STATE__:', e);
          }
        }
        
        // Try to find next data
        if (!jsonData) {
          const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/);
          if (nextDataMatch && nextDataMatch[1]) {
            try {
              const nextData = JSON.parse(nextDataMatch[1]);
              // Check various paths in the Next.js data structure
              if (nextData.props?.pageProps?.searchResult?.products) {
                jsonData = nextData.props.pageProps.searchResult.products;
                console.log(`Found ${jsonData.length} products in __NEXT_DATA__ searchResult`);
              } else if (nextData.props?.pageProps?.initialState?.search?.products) {
                jsonData = nextData.props.pageProps.initialState.search.products;
                console.log(`Found ${jsonData.length} products in __NEXT_DATA__ initialState`);
              } else if (nextData.props?.pageProps?.products) {
                jsonData = nextData.props.pageProps.products;
                console.log(`Found ${jsonData.length} products in __NEXT_DATA__ props`);
              }
            } catch (e) {
              console.log('Failed to parse __NEXT_DATA__:', e);
            }
          }
        }
        
        // Look for product data in JSON-LD format
        if (!jsonData) {
          const jsonldMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/g);
          if (jsonldMatch) {
            for (const script of jsonldMatch) {
              try {
                const scriptContent = script.replace(/<script type="application\/ld\+json">/, '').replace(/<\/script>/, '');
                const ldData = JSON.parse(scriptContent);
                if (ldData['@type'] === 'ItemList' && ldData.itemListElement && ldData.itemListElement.length > 0) {
                  const items = ldData.itemListElement.map((item: any) => item.item || item);
                  jsonData = items;
                  console.log(`Found ${jsonData.length} products in JSON-LD data`);
                  break;
                }
              } catch (e) {
                // Continue to next JSON-LD script
              }
            }
          }
        }
        
        // If we found JSON data, extract products
        if (jsonData && Array.isArray(jsonData) && jsonData.length > 0) {
          for (const item of jsonData) {
            if (products.length >= 20) break;
            
            try {
              // Extract needed properties with fallbacks
              const id = item.id || item.productId || item.code || item.sku || '';
              if (!id) continue;
              
              const title = item.name || item.title || item.displayName || '';
              
              // Handle price which might be in various formats
              let price = 0;
              if (typeof item.price === 'number') {
                price = item.price;
              } else if (item.price?.value) {
                price = parseFloat(item.price.value);
              } else if (item.price?.current) {
                price = parseFloat(item.price.current);
              } else if (item.salePrice) {
                price = parseFloat(item.salePrice);
              } else if (item.offerPrice) {
                price = parseFloat(item.offerPrice);
              }
              
              // Handle original price
              let originalPrice: number | undefined;
              if (typeof item.originalPrice === 'number' && item.originalPrice > price) {
                originalPrice = item.originalPrice;
              } else if (item.price?.was && parseFloat(item.price.was) > price) {
                originalPrice = parseFloat(item.price.was);
              } else if (item.price?.original && parseFloat(item.price.original) > price) {
                originalPrice = parseFloat(item.price.original);
              } else if (item.listPrice && parseFloat(item.listPrice) > price) {
                originalPrice = parseFloat(item.listPrice);
              }
              
              // Calculate discount
              let discount: number | undefined;
              if (originalPrice && price && originalPrice > price) {
                discount = Math.round(((originalPrice - price) / originalPrice) * 100);
              } else if (item.discountPercentage || item.discount) {
                discount = parseFloat(item.discountPercentage || item.discount);
              }
              
              // Handle image URL
              let image = '';
              if (item.image) {
                image = typeof item.image === 'string' ? item.image : item.image.url || item.image.src || '';
              } else if (item.images && item.images.length > 0) {
                image = item.images[0].url || item.images[0].src || item.images[0];
              } else if (item.imageUrl) {
                image = item.imageUrl;
              }
              
              // Ensure the image URL is complete
              if (image && !image.startsWith('http')) {
                if (image.startsWith('/')) {
                  image = `https://www.carrefouregypt.com${image}`;
                } else {
                  image = `https://www.carrefouregypt.com/${image}`;
                }
              }
              
              // Product URL
              let url = '';
              if (item.url) {
                url = item.url.startsWith('http') ? item.url : `https://www.carrefouregypt.com${item.url}`;
              } else {
                url = `https://www.carrefouregypt.com/mafegy/ar/products/${id}`;
              }
              
              // Brand
              const brand = item.brand || '';
              
              // Additional properties
              const isFreeDelivery = item.freeDelivery || item.freeShipping || false;
              const isPromotional = discount !== undefined && discount > 0;
              
              console.log(`Found Carrefour product from JSON: ${title} at ${price} EGP`);
              
              products.push({
                id: `carrefour-${id}`,
                title,
                price,
                originalPrice,
                discount,
                image,
                url,
                platform: 'carrefour',
                brand,
                isFreeDelivery,
                isPromotional,
                isBestPrice: false
              });
            } catch (e) {
              console.error('Error processing Carrefour JSON product:', e);
            }
          }
          
          // If we successfully extracted products from JSON, return them
          if (products.length > 0) {
            console.log(`Returning ${products.length} Carrefour products from JSON data`);
            return products;
          }
        }
      } catch (jsonError) {
        console.log('JSON extraction failed for Carrefour, falling back to HTML parsing:', jsonError);
      }
      
      // HTML parsing approach if JSON extraction failed
      console.log('Starting HTML parsing for Carrefour products');
      
      // Look for product images and links in preload tags in the head section
      const preloadItems: Array<{id: string, image: string}> = [];
      
      // Multiple selectors to capture different Carrefour HTML structures
      const preloadLinks = $('link[rel="preload"][as="image"][href*="mafrservices"], link[rel="preload"][as="image"][href*="cdn.mafrservices.com"]');
      console.log(`Found ${preloadLinks.length} preloaded product images`);
      
      preloadLinks.each((i, element) => {
        try {
          const imageUrl = $(element).attr('href') || '';
          if (imageUrl) {
            // Extract product ID from image URL
            const urlParts = imageUrl.split('/');
            let productId = '';
            
            // Look for product ID patterns in URL
            for (const part of urlParts) {
              if (/^\d+$/.test(part) || /^\w{6,}_main/.test(part)) {
                productId = part.replace('_main', '');
                break;
              }
            }
            
            if (productId) {
              preloadItems.push({
                id: productId,
                image: imageUrl
              });
            }
          }
        } catch (e) {
          // Continue to next preload link
        }
      });
      
      // If we found preloaded images, try to extract corresponding product data
      if (preloadItems.length > 0) {
        console.log(`Processing ${preloadItems.length} preloaded Carrefour products`);
        
        for (const item of preloadItems) {
          if (products.length >= 20) break;
          
          try {
            // Assume a standard product page URL format
            const url = `https://www.carrefouregypt.com/mafegy/ar/products/${item.id}`;
            
            // Use a generic title based on search query
            const title = `${query.charAt(0).toUpperCase() + query.slice(1)} - Carrefour`;
            
            // Create a minimal product entry
            products.push({
              id: `carrefour-${item.id}`,
              title,
              price: 0, // We don't have price information at this level
              image: item.image,
              url,
              platform: 'carrefour',
              isBestPrice: false
            });
          } catch (e) {
            console.error('Error processing Carrefour preloaded product:', e);
          }
        }
        
        if (products.length > 0) {
          console.log(`Extracted ${products.length} Carrefour products from preloaded images`);
          return products;
        }
      }
      
      // Log all possible product containers we find
      const mainGridCount = $('ul[data-testid="plp-products-grid"] li').length;
      const alternativeGridCount = $('.product-grid-item, .product-list-item, .product-tile').length;
      const anyProductLinks = $('a[href*="/product/"]').length;
      const productCards = $('.product-card, [class*="productCard"], [class*="ProductCard"]').length;
      
      console.log(`Carrefour containers found: MainGrid=${mainGridCount}, AltGrid=${alternativeGridCount}, ProductLinks=${anyProductLinks}, ProductCards=${productCards}`);
      
      // Try standard HTML product containers if we still don't have products
      // Check for current Carrefour layout containers
      if (productCards > 0) {
        $('.product-card, [class*="productCard"], [class*="ProductCard"]').each((i, element) => {
          if (products.length >= 20) return false;
          
          try {
            // Find product link
            const link = $(element).find('a');
            if (!link.length) return;
            
            const href = link.attr('href') || '';
            // Extract product ID from URL
            const productId = href.split('/').pop() || '';
            
            if (!productId) return;
            
            // Try to find product title
            const titleElement = $(element).find('[class*="title"], [class*="name"], h2, h3, h4');
            const title = titleElement.length ? titleElement.text().trim() : `${query} - Carrefour`;
            
            // Try to find price
            let price = 0;
            const priceElement = $(element).find('[class*="price"], [class*="Price"]');
            if (priceElement.length) {
              const priceText = priceElement.text().trim();
              price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;
            }
            
            // Find image
            let image = '';
            const img = $(element).find('img');
            if (img.length) {
              image = img.attr('src') || img.attr('data-src') || '';
            }
            
            // Create URL
            const url = href.startsWith('http') ? href : `https://www.carrefouregypt.com${href}`;
            
            products.push({
              id: `carrefour-${productId}`,
              title,
              price,
              image,
              url,
              platform: 'carrefour',
              isBestPrice: false
            });
          } catch (e) {
            console.error('Error processing Carrefour product card:', e);
          }
        });
      }
      
      // Try the main product grid next
      if (products.length === 0 && mainGridCount > 0) {
        $('ul[data-testid="plp-products-grid"] li').each((i, element) => {
          if (products.length >= 20) return false;
          
          try {
            // Extract product URL
            let productUrl = '';
            const productLink = $(element).find('a[data-testid="product-tile"], a[href*="/product/"]');
            
            if (productLink.length > 0) {
              productUrl = productLink.attr('href') || '';
            } else {
              // Last resort: any link in the container
              const anyLink = $(element).find('a');
              if (anyLink.length > 0) {
                productUrl = anyLink.attr('href') || '';
              }
            }
            
            if (!productUrl) return;
            
            // Extract product ID from URL
            const productId = productUrl.split('/').pop() || '';
            
            // Title
            let title = '';
            const titleElement = $(element).find('[data-testid="product-name"], .product-name, .product-title, h3');
            if (titleElement.length > 0) {
              title = titleElement.text().trim();
            }
            
            if (!title) {
              title = `${query} - Carrefour`;
            }
            
            // Price
            let price = 0;
            const priceElement = $(element).find('[data-testid="current-price"], .price, .current-price');
            if (priceElement.length > 0) {
              const priceText = priceElement.text().trim();
              price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;
            }
            
            // Image
            let image = '';
            const imgElement = $(element).find('img');
            if (imgElement.length > 0) {
              image = imgElement.attr('src') || imgElement.attr('data-src') || '';
            }
            
            // URL
            const url = productUrl.startsWith('http') ? productUrl : `https://www.carrefouregypt.com${productUrl}`;
            
            products.push({
              id: `carrefour-${productId}`,
              title,
              price,
              image,
              url,
              platform: 'carrefour',
              isBestPrice: false
            });
          } catch (e) {
            console.error('Error processing Carrefour grid product:', e);
          }
        });
      }
      
      // If we still don't have products, try generic approach with any product links
      if (products.length === 0 && anyProductLinks > 0) {
        $('a[href*="/product/"]').each((i, element) => {
          if (products.length >= 20) return false;
          
          try {
            const href = $(element).attr('href') || '';
            const productId = href.split('/').pop() || '';
            
            if (!productId) return;
            
            // Try to get a reasonable title
            let title = $(element).text().trim();
            if (!title || title.length > 100) {
              title = `${query} - Carrefour`;
            }
            
            // Look for an image near the link
            let image = '';
            const parentContainer = $(element).closest('div');
            const imgElement = parentContainer.find('img');
            if (imgElement.length > 0) {
              image = imgElement.attr('src') || imgElement.attr('data-src') || '';
            }
            
            // URL
            const url = href.startsWith('http') ? href : `https://www.carrefouregypt.com${href}`;
            
            products.push({
              id: `carrefour-${productId}`,
              title,
              price: 0, // We don't have price information
              image,
              url,
              platform: 'carrefour',
              isBestPrice: false
            });
          } catch (e) {
            console.error('Error processing Carrefour product link:', e);
          }
        });
      }
      
      console.log(`Found ${products.length} Carrefour products`);
      return products;
    } catch (error) {
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
  

}
