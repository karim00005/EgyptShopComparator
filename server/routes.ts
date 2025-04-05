import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertFavoriteProductSchema, 
  insertPriceAlertSchema,
  searchParamsSchema 
} from "../shared/schema";
import { productService } from "./services/productService";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handling middleware for validation errors
  const handleValidationError = (err: any, res: Response) => {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: err.errors
      });
    }
    return res.status(500).json({ message: "Internal server error" });
  };

  // API routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Product search endpoint
  app.get("/api/products/search", async (req, res) => {
    try {
      // Accept either 'q' or 'query' parameter for search
      let query = (req.query.q || req.query.query) as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      // Fix for Arabic character encoding when coming from URL
      try {
        // Handle URL encoded Arabic words
        // If query already contains Arabic characters, this is a no-op
        // If query is URL encoded, this properly converts to Arabic
        if (query.includes('%')) {
          query = decodeURIComponent(query);
        }
      } catch (decodeError) {
        console.warn('Failed to decode query parameter:', decodeError);
        // Continue with original query if decoding fails
      }

      console.log(`Searching for: "${query}" (decoded)`);

      // Parse and validate search parameters
      const searchParams = searchParamsSchema.parse({
        query,
        category: req.query.category as string,
        priceRange: req.query.priceRange as string,
        sort: req.query.sort as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        platforms: req.query.platforms 
          ? (req.query.platforms as string).split(',') 
          : ['amazon', 'noon', 'carrefour', 'talabat']
      });

      const products = await productService.searchProducts(searchParams);
      res.json(products);
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  // Product details endpoint
  app.get("/api/products/:platform/:id", async (req, res) => {
    try {
      const { platform, id } = req.params;
      const product = await productService.getProductDetails(platform, id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (err) {
      console.error("Error fetching product details:", err);
      res.status(500).json({ message: "Failed to fetch product details" });
    }
  });

  // User related routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already registered" });
      }
      
      const user = await storage.createUser(userData);
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Don't return password in response
      const { password: _, ...userWithoutPassword } = user;
      
      // In a real app, you would set up a session here
      res.json(userWithoutPassword);
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Favorites routes
  app.get("/api/favorites", async (req, res) => {
    try {
      // In a real app, get userId from session
      const userId = parseInt(req.query.userId as string);
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const favorites = await storage.getFavoriteProducts(userId);
      
      // Get detailed product information for each favorite
      const productDetails = await Promise.all(
        favorites.map(async (favorite) => {
          try {
            const product = await productService.getProductDetails(
              favorite.platform, 
              favorite.productId
            );
            return product;
          } catch (error) {
            console.error(`Failed to fetch details for ${favorite.productId}:`, error);
            return null;
          }
        })
      );
      
      // Filter out null products (failed to fetch)
      const validProducts = productDetails.filter(product => product !== null);
      
      res.json(validProducts);
    } catch (err) {
      console.error("Error fetching favorites:", err);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", async (req, res) => {
    try {
      const favoriteData = insertFavoriteProductSchema.parse(req.body);
      const favorite = await storage.addFavoriteProduct(favoriteData);
      res.status(201).json(favorite);
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  app.delete("/api/favorites", async (req, res) => {
    try {
      const { userId, productId, platform } = req.body;
      
      if (!userId || !productId || !platform) {
        return res.status(400).json({ 
          message: "User ID, product ID, and platform are required" 
        });
      }
      
      await storage.removeFavoriteProduct(
        parseInt(userId as string), 
        productId as string, 
        platform as string
      );
      
      res.status(204).send();
    } catch (err) {
      console.error("Error removing favorite:", err);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  // Price alerts routes
  app.get("/api/price-alerts", async (req, res) => {
    try {
      // In a real app, get userId from session
      const userId = parseInt(req.query.userId as string);
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const alerts = await storage.getPriceAlerts(userId);
      res.json(alerts);
    } catch (err) {
      console.error("Error fetching price alerts:", err);
      res.status(500).json({ message: "Failed to fetch price alerts" });
    }
  });

  app.post("/api/price-alerts", async (req, res) => {
    try {
      const alertData = insertPriceAlertSchema.parse(req.body);
      const alert = await storage.addPriceAlert(alertData);
      res.status(201).json(alert);
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  app.patch("/api/price-alerts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const alert = await storage.updatePriceAlert(id, updates);
      res.json(alert);
    } catch (err) {
      console.error("Error updating price alert:", err);
      res.status(500).json({ message: "Failed to update price alert" });
    }
  });

  app.delete("/api/price-alerts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removePriceAlert(id);
      res.status(204).send();
    } catch (err) {
      console.error("Error removing price alert:", err);
      res.status(500).json({ message: "Failed to remove price alert" });
    }
  });

  // Platform config routes (would be admin-only in a real app)
  app.get("/api/platform-configs", async (_req, res) => {
    try {
      const configs = await storage.getPlatformConfigs();
      res.json(configs);
    } catch (err) {
      console.error("Error fetching platform configs:", err);
      res.status(500).json({ message: "Failed to fetch platform configs" });
    }
  });

  app.get("/api/platform-configs/:platform", async (req, res) => {
    try {
      const { platform } = req.params;
      const config = await storage.getPlatformConfig(platform);
      
      if (!config) {
        return res.status(404).json({ message: "Platform config not found" });
      }
      
      res.json(config);
    } catch (err) {
      console.error("Error fetching platform config:", err);
      res.status(500).json({ message: "Failed to fetch platform config" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
