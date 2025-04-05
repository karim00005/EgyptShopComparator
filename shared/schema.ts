import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const favoriteProducts = pgTable("favorite_products", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: text("product_id").notNull(),
  platform: text("platform").notNull(),
  dateAdded: timestamp("date_added").defaultNow().notNull(),
});

export const insertFavoriteProductSchema = createInsertSchema(favoriteProducts).pick({
  userId: true,
  productId: true,
  platform: true,
});

export const priceAlerts = pgTable("price_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: text("product_id").notNull(),
  platform: text("platform").notNull(),
  targetPrice: integer("target_price").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  dateCreated: timestamp("date_created").defaultNow().notNull(),
});

export const insertPriceAlertSchema = createInsertSchema(priceAlerts).pick({
  userId: true,
  productId: true,
  platform: true,
  targetPrice: true,
});

export const platformConfigs = pgTable("platform_configs", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull().unique(),
  config: jsonb("config").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertPlatformConfigSchema = createInsertSchema(platformConfigs).pick({
  platform: true,
  config: true,
  isActive: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFavoriteProduct = z.infer<typeof insertFavoriteProductSchema>;
export type FavoriteProduct = typeof favoriteProducts.$inferSelect;

export type InsertPriceAlert = z.infer<typeof insertPriceAlertSchema>;
export type PriceAlert = typeof priceAlerts.$inferSelect;

export type InsertPlatformConfig = z.infer<typeof insertPlatformConfigSchema>;
export type PlatformConfig = typeof platformConfigs.$inferSelect;

// Additional types for frontend-backend communication
export const productSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  originalPrice: z.number().optional(),
  discount: z.number().optional(),
  image: z.string(),
  url: z.string(),
  platform: z.string(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  description: z.string().optional(),
  isPromotional: z.boolean().optional(),
  isFreeDelivery: z.boolean().optional(),
  isBestPrice: z.boolean().optional(),
  brand: z.string().optional(),
  specs: z.array(z.object({
    key: z.string(),
    value: z.string()
  })).optional(),
});

export type Product = z.infer<typeof productSchema>;

export const searchParamsSchema = z.object({
  query: z.string(),
  category: z.string().optional(),
  priceRange: z.string().optional(),
  sort: z.string().optional(),
  page: z.number().optional(),
  platforms: z.array(z.string()).optional(),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;
