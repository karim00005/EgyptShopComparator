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
      
      // First, try with the direct API endpoint (per user's suggestion)
      const directApiUrl = `https://www.carrefouregypt.com/mafegy/ar/v4/search?keyword=${encodedQuery}`;
      
      console.log(`Making request to Carrefour API URL: ${directApiUrl}`);
      
      try {
        // Make the request with browser-like headers
        const response = await axios.get(directApiUrl, {
          headers: {
            ...this.headers,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
            'Referer': 'https://www.carrefouregypt.com/',
            'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-User': '?1'
          },
          timeout: 20000, // Increased timeout for reliability
          maxContentLength: 10 * 1024 * 1024 // 10MB max response size
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
      } catch (requestError) {
        console.error('Error making request to Carrefour:', requestError);
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
      const preloadLinks = $('link[rel="preload"][as="image"][href*="mafrservices"]');
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
