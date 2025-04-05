import axios from 'axios';
import * as cheerio from 'cheerio';
import { Product } from '../shared/schema'; // Import Product interface
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
      
      // Fallback to HTML scraping
      const htmlUrl = `https://www.carrefouregypt.com/mafegy/ar/v4/search?keyword=${encodedQuery}`;
      
      console.log(`Making request to Carrefour HTML URL: ${htmlUrl}`);
      
      try {
        // Make the request with browser-like headers
        const response = await axios.get(htmlUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            'Referer': 'https://www.carrefouregypt.com/',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive'
          },
          timeout: 15000 // 15 second timeout
        });
        
        if (response.status === 200) {
          return this.parseSearchResults(response.data, query);
        }
      } catch (htmlError) {
        console.error('Error making request to Carrefour HTML page:', htmlError);
      }
      
      console.log('All approaches to fetch Carrefour products failed');
      return [];
    } catch (error: any) {
      console.error('Error searching Carrefour Egypt:', error);
      return []; // Return empty array
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
      
      // Look for product containers
      $('.product-item').each((i, element) => {
        const title = $(element).find('.product-title').text().trim();
        const priceText = $(element).find('.price').text().trim();
        const price = parseFloat(priceText.replace(/[^\d.]/g, ''));
        const image = $(element).find('img').attr('src') || '';
        const url = $(element).find('a').attr('href') || '';
        
        if (title && price && image && url) {
          products.push({
            id: `carrefour-${i}`,
            title,
            price,
            image,
            url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
            platform: 'carrefour',
            isBestPrice: false
          });
        }
      });
      
      console.log(`Found ${products.length} Carrefour products`);
      return products;
    } catch (error) {
      console.error('Error parsing Carrefour search results:', error);
      return [];
    }
  }
  
  // ... (rest of the class remains unchanged)
}
