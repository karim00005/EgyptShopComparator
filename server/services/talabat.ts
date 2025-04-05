import axios from "axios";
import * as cheerio from "cheerio";
import { Product } from "@shared/schema";
import { getPlatformConfig } from "../config/platformConfig";

export class TalabatService {
  private baseUrl: string;
  private searchUrl: string;
  private productUrl: string;
  private headers: Record<string, string>;
  private timeout: number;

  constructor() {
    const config = getPlatformConfig("talabat");

    if (!config) {
      throw new Error("Talabat platform configuration not found");
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

      // Prepare the search URL - first try API endpoint, then fallback to HTML
      // Based on actual API endpoint from curl examples
      const apiSearchUrl = `${this.baseUrl}/nextApi/groceries/stores/0bbe2d06-bbf4-4992-b74f-d19304dd4fc8/products?countryId=9&query=${encodeURIComponent(query)}&limit=50&offset=0&isDarkstore=true&isMigrated=false`;
      const fallbackSearchUrl = `${this.searchUrl}?q=${encodeURIComponent(query)}`;

      console.log(`Making request to Talabat API URL: ${apiSearchUrl}`);

      try {
        // First try the API endpoint which returns JSON
        const apiResponse = await axios.get(apiSearchUrl, {
          headers: {
            ...this.headers,
            Accept: "application/json, text/plain, */*",
            appbrand: "1",
            sourceapp: "web",
            "x-device-source": "0",
          },
          timeout: this.timeout,
        });

        if (apiResponse.status === 200 && apiResponse.data) {
          console.log("Successfully used Talabat API endpoint");
          return this.parseSearchResults(apiResponse.data, query);
        }
      } catch (apiError) {
        console.log(
          "Talabat API endpoint failed, falling back to HTML scraping",
          apiError,
        );
      }

      // Fallback to HTML scraping if API endpoint fails
      const response = await axios.get(fallbackSearchUrl, {
        headers: this.headers,
        timeout: this.timeout,
      });

      // If we got a response, parse it
      if (response.status === 200) {
        return this.parseSearchResults(response.data, query);
      }

      return [];
    } catch (error) {
      console.error("Error searching Talabat Egypt:", error);
      return []; // Return empty array instead of mock data
    }
  }

  /**
   * Get detailed product information
   */
  async getProductDetails(productId: string): Promise<Product | null> {
    try {
      console.log(`Fetching Talabat Egypt product details for: ${productId}`);

      // Extract the product code if it's a full URL
      const productCode = productId.includes("/item/")
        ? productId.split("/item/")[1].split("/")[0]
        : productId;

      // First try the API endpoint which returns JSON
      const apiUrl = `${this.baseUrl}/api/catalog/item/${productCode}?country=eg&language=ar`;
      const fallbackUrl = `${this.productUrl}/${productCode}`;

      try {
        // Try the API endpoint first
        const apiResponse = await axios.get(apiUrl, {
          headers: {
            ...this.headers,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          timeout: this.timeout,
        });

        if (apiResponse.status === 200 && apiResponse.data) {
          console.log(
            "Successfully used Talabat API endpoint for product details",
          );
          return this.parseProductDetails(apiResponse.data, productCode);
        }
      } catch (apiError) {
        console.log(
          "Talabat API endpoint failed for product details, falling back to HTML scraping",
          apiError,
        );
      }

      // Fallback to HTML scraping if API endpoint fails
      const response = await axios.get(fallbackUrl, {
        headers: this.headers,
        timeout: this.timeout,
      });

      // If we got a response, parse it
      if (response.status === 200) {
        return this.parseProductDetails(response.data, productCode);
      }

      return null;
    } catch (error) {
      console.error(
        `Error fetching Talabat Egypt product ${productId}:`,
        error,
      );
      return null; // Return null instead of mock data
    }
  }

  /**
   * Parse Talabat search results page
   */
  private parseSearchResults(data: any, query: string): Product[] {
    try {
      const products: Product[] = [];

      // Check if data is JSON format
      if (typeof data === "object" && data.items && Array.isArray(data.items)) {
        // Process JSON API response
        for (const item of data.items) {
          if (products.length >= 20) break; // Limit to 20 products

          try {
            // Extract required fields from JSON
            const productId = item.id || "";
            const title = item.title || "";
            const slug = item.slug || "";
            const description = item.description || "";

            // Construct URL
            const url = `${this.baseUrl}/egypt/grocery/item/${productId}`;

            // Get price - assuming there might be different price formats
            let price = 0;
            if (item.price) {
              price =
                typeof item.price === "number"
                  ? item.price
                  : parseFloat(String(item.price).replace(/[^\d.]/g, ""));
            }

            // Original price if available
            let originalPrice: number | undefined;
            if (item.originalPrice) {
              originalPrice =
                typeof item.originalPrice === "number"
                  ? item.originalPrice
                  : parseFloat(
                      String(item.originalPrice).replace(/[^\d.]/g, ""),
                    );
            }

            // Calculate discount if both prices available
            let discount: number | undefined;
            if (originalPrice && price && originalPrice > price) {
              discount = Math.round(
                ((originalPrice - price) / originalPrice) * 100,
              );
            } else if (item.discount) {
              discount =
                typeof item.discount === "number"
                  ? item.discount
                  : parseInt(String(item.discount).replace(/[^\d]/g, ""), 10);
            }

            // Get image URL
            const image = item.image || "";

            // Get brand
            const brand = item.brand || "Talabat";

            // Rating and review count if available
            const rating = item.rating
              ? parseFloat(String(item.rating))
              : undefined;
            const reviewCount = item.reviewCount
              ? parseInt(String(item.reviewCount), 10)
              : undefined;

            // Promotional flags
            const isPromotional = item.isPromotional || false;
            const isFreeDelivery = item.isFreeDelivery || false;

            products.push({
              id: `talabat-${productId}`,
              title,
              price,
              originalPrice,
              discount,
              image: image || 
                "https://images.deliveryhero.io/image/talabat/Menuitems/no_image_available.jpg",
              url,
              platform: "talabat",
              rating,
              reviewCount,
              description,
              isFreeDelivery,
              isPromotional,
              brand,
              isBestPrice: false,
            });
          } catch (e) {
            console.error("Error parsing Talabat product from JSON:", e);
          }
        }

        return products;
      } else {
        // Fallback to HTML parsing for non-JSON responses
        const $ = cheerio.load(typeof data === "string" ? data : "");

        // Get product items from Talabat search results
        $(".product-item").each((i, element) => {
          if (products.length >= 20) return; // Limit to 20 products

          try {
            // Extract product details
            const productUrl =
              $(element).find("a.product-link").attr("href") || "";
            if (!productUrl) return;

            const productId = productUrl.split("/").pop() || "";

            // Title
            const title = $(element).find(".product-title").text().trim();

            // URL
            const url = this.baseUrl + productUrl;

            // Price
            let price = 0;
            const priceText = $(element).find(".product-price").text().trim();
            if (priceText) {
              price = parseFloat(priceText.replace(/[^\d.]/g, ""));
            }

            // Original price
            let originalPrice: number | undefined;
            const oldPriceText = $(element)
              .find(".product-old-price")
              .text()
              .trim();
            if (oldPriceText) {
              originalPrice = parseFloat(oldPriceText.replace(/[^\d.]/g, ""));
            }

            // Discount
            let discount: number | undefined;
            if (originalPrice && price && originalPrice > price) {
              discount = Math.round(
                ((originalPrice - price) / originalPrice) * 100,
              );
            } else {
              const discountText = $(element)
                .find(".discount-badge")
                .text()
                .trim();
              if (discountText && discountText.includes("%")) {
                discount = parseInt(discountText.replace(/[^\d]/g, ""), 10);
              }
            }

            // Image
            const image =
              $(element).find(".product-image img").attr("src") || "";

            // Rating
            let rating: number | undefined;
            const ratingText = $(element).find(".product-rating").text().trim();
            if (ratingText) {
              rating = parseFloat(ratingText);
            }

            // Review count
            let reviewCount: number | undefined;
            const reviewText = $(element)
              .find(".product-reviews-count")
              .text()
              .trim();
            if (reviewText) {
              reviewCount = parseInt(reviewText.replace(/[^\d]/g, ""), 10);
            }

            // Check for promotional flags
            const isPromotional =
              $(element).find(".promotional-badge").length > 0;

            // Check for free delivery
            const isFreeDelivery =
              $(element).find(".free-delivery-badge").length > 0;

            // Brand, if available
            const brand =
              $(element).find(".product-brand").text().trim() || "Talabat";

            products.push({
              id: `talabat-${productId}`,
              title,
              price,
              originalPrice,
              discount,
              image,
              url,
              platform: "talabat",
              rating,
              reviewCount,
              isFreeDelivery,
              isPromotional,
              brand,
              isBestPrice: false, // Will be calculated later
            });
          } catch (e) {
            console.error("Error parsing Talabat product from HTML:", e);
          }
        });
      }

      return products;
    } catch (error) {
      console.error("Error parsing Talabat search results:", error);
      return []; // Return empty array instead of mock data
    }
  }

  /**
   * Parse product details page
   */
  private parseProductDetails(data: any, productCode: string): Product | null {
    try {
      // Check if data is in JSON format
      if (typeof data === "object" && data !== null) {
        // Try to extract fields from JSON structure
        const title = data.title || "";

        // Get price - assuming there might be different price formats
        let price = 0;
        if (data.price) {
          price =
            typeof data.price === "number"
              ? data.price
              : parseFloat(String(data.price).replace(/[^\d.]/g, ""));
        }

        // Original price if available
        let originalPrice: number | undefined;
        if (data.originalPrice) {
          originalPrice =
            typeof data.originalPrice === "number"
              ? data.originalPrice
              : parseFloat(String(data.originalPrice).replace(/[^\d.]/g, ""));
        }

        // Calculate discount if both prices available
        let discount: number | undefined;
        if (originalPrice && price && originalPrice > price) {
          discount = Math.round(
            ((originalPrice - price) / originalPrice) * 100,
          );
        } else if (data.discount) {
          discount =
            typeof data.discount === "number"
              ? data.discount
              : parseInt(String(data.discount).replace(/[^\d]/g, ""), 10);
        }

        // Get image URL
        const image = data.image || "";

        // Get description
        const description = data.description || "";

        // Get brand
        const brand = data.brand || "Talabat";

        // Rating and review count if available
        const rating = data.rating
          ? parseFloat(String(data.rating))
          : undefined;
        const reviewCount = data.reviewCount
          ? parseInt(String(data.reviewCount), 10)
          : undefined;

        // Promotional flags
        const isPromotional = data.isPromotional || false;
        const isFreeDelivery = data.isFreeDelivery || false;

        // Extract specifications if available
        const specs: { key: string; value: string }[] = [];
        if (data.specs && Array.isArray(data.specs)) {
          data.specs.forEach((spec: any) => {
            if (spec && typeof spec === "object" && spec.key && spec.value) {
              specs.push({ key: spec.key, value: spec.value });
            }
          });
        } else if (data.attributes && Array.isArray(data.attributes)) {
          data.attributes.forEach((attr: any) => {
            if (attr && typeof attr === "object" && attr.name && attr.value) {
              specs.push({ key: attr.name, value: attr.value });
            }
          });
        }

        return {
          id: `talabat-${productCode}`,
          title,
          price,
          originalPrice,
          discount,
          image: image || 
            "https://images.deliveryhero.io/image/talabat/Menuitems/no_image_available.jpg",
          url: `${this.baseUrl}/egypt/grocery/item/${productCode}`,
          platform: "talabat",
          rating,
          reviewCount,
          description,
          isFreeDelivery,
          isPromotional:
            isPromotional || (discount !== undefined && discount > 0),
          brand,
          specs,
          isBestPrice: false,
        };
      } else {
        // Fallback to HTML parsing for non-JSON responses
        const $ = cheerio.load(typeof data === "string" ? data : "");

        // Extract product title
        const title = $(".product-title").text().trim();

        // Extract current price
        let price = 0;
        const priceText = $(".product-price").text().trim();
        if (priceText) {
          price = parseFloat(priceText.replace(/[^\d.]/g, ""));
        }

        // Extract original price if discounted
        let originalPrice: number | undefined;
        const oldPriceText = $(".product-old-price").text().trim();
        if (oldPriceText) {
          originalPrice = parseFloat(oldPriceText.replace(/[^\d.]/g, ""));
        }

        // Calculate discount
        let discount: number | undefined;
        if (originalPrice && price && originalPrice > price) {
          discount = Math.round(
            ((originalPrice - price) / originalPrice) * 100,
          );
        } else {
          const discountText = $(".discount-badge").text().trim();
          if (discountText && discountText.includes("%")) {
            discount = parseInt(discountText.replace(/[^\d]/g, ""), 10);
          }
        }

        // Extract product image
        const image = $(".product-image img").attr("src") || "";

        // Extract product description
        const description = $(".product-description").text().trim();

        // Extract product rating
        let rating: number | undefined;
        const ratingText = $(".product-rating").text().trim();
        if (ratingText) {
          rating = parseFloat(ratingText);
        }

        // Extract review count
        let reviewCount: number | undefined;
        const reviewText = $(".product-reviews-count").text().trim();
        if (reviewText) {
          reviewCount = parseInt(reviewText.replace(/[^\d]/g, ""), 10);
        }

        // Check for free delivery
        const isFreeDelivery = $(".free-delivery-badge").length > 0;

        // Extract brand
        const brand = $(".product-brand").text().trim() || "Talabat";

        // Extract specifications
        const specs: { key: string; value: string }[] = [];
        $(".product-specs li").each((i, item) => {
          const text = $(item).text().trim();
          const parts = text.split(":");
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
          platform: "talabat",
          rating,
          reviewCount,
          description,
          isFreeDelivery,
          isPromotional: discount !== undefined && discount > 0,
          brand,
          specs,
          isBestPrice: false,
        };
      }
    } catch (error) {
      console.error(
        `Error parsing Talabat product details for ${productCode}:`,
        error,
      );
      return null; // Return null instead of mock data
    }
  }


}
