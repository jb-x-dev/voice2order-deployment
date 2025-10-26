import { boolean, date, integer, numeric, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * PostgreSQL enums - must be defined before tables
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const categoryEnum = pgEnum("category", ["hauptgericht", "beilage", "dessert", "vorspeise", "getraenk", "sonstiges"]);
export const menuPlanStatusEnum = pgEnum("menu_plan_status", ["entwurf", "vorlage", "aktiv", "archiviert"]);
export const mealTypeEnum = pgEnum("meal_type", ["fruehstueck", "mittagessen", "abendessen", "snack"]);
export const orderListStatusEnum = pgEnum("order_list_status", ["entwurf", "bestaetigt", "bestellt", "archiviert"]);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Recipes table - stores recipe information
 */
export const recipes = pgTable("recipes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: categoryEnum("category").default("hauptgericht").notNull(),
  defaultPortions: integer("defaultPortions").default(4).notNull(),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = typeof recipes.$inferInsert;

/**
 * Recipe ingredients table - stores ingredients for each recipe
 */
export const recipeIngredients = pgTable("recipeIngredients", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  recipeId: integer("recipeId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: varchar("quantity", { length: 100 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  pricePerUnit: integer("pricePerUnit").default(0), // in cents
  notes: text("notes"),
});

export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type InsertRecipeIngredient = typeof recipeIngredients.$inferInsert;

/**
 * Menu plans table - stores weekly/monthly menu plans
 */
export const menuPlans = pgTable("menuPlans", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  description: text("description"),
  status: menuPlanStatusEnum("status").default("entwurf").notNull(),
  maxBudgetPerDay: integer("maxBudgetPerDay").default(0), // in cents
  budgetTolerance: numeric("budgetTolerance", { precision: 5, scale: 2 }).default("10.00"), // in percent
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type MenuPlan = typeof menuPlans.$inferSelect;
export type InsertMenuPlan = typeof menuPlans.$inferInsert;

/**
 * Menu plan entries table - stores individual meals in a menu plan
 */
export const menuPlanEntries = pgTable("menuPlanEntries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  menuPlanId: integer("menuPlanId").notNull(),
  date: timestamp("date").notNull(),
  mealType: mealTypeEnum("mealType").notNull(),
  recipeId: integer("recipeId").notNull(),
  portions: integer("portions").default(4).notNull(),
  notes: text("notes"),
});

export type MenuPlanEntry = typeof menuPlanEntries.$inferSelect;
export type InsertMenuPlanEntry = typeof menuPlanEntries.$inferInsert;

/**
 * Menu plan recipes table - stores multiple recipes per meal entry
 */
export const menuPlanRecipes = pgTable("menuPlanRecipes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  entryId: integer("entryId").notNull(),
  recipeId: integer("recipeId").notNull(),
  portions: integer("portions").default(4).notNull(),
  isSelected: boolean("isSelected").default(true),
  isAlternative: boolean("isAlternative").default(false),
  sortOrder: integer("sortOrder").default(0),
});

export type MenuPlanRecipe = typeof menuPlanRecipes.$inferSelect;
export type InsertMenuPlanRecipe = typeof menuPlanRecipes.$inferInsert;

/**
 * Order lists table - stores procurement order lists
 */
export const orderLists = pgTable("orderLists", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  menuPlanId: integer("menuPlanId"),
  name: varchar("name", { length: 255 }).notNull(),
  status: orderListStatusEnum("status").default("entwurf").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type OrderList = typeof orderLists.$inferSelect;
export type InsertOrderList = typeof orderLists.$inferInsert;

/**
 * Order list items table - stores items in an order list
 */
export const orderListItems = pgTable("orderListItems", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderListId: integer("orderListId").notNull(),
  recipeId: integer("recipeId").notNull(),
  portions: integer("portions").notNull(),
  orderDay: date("orderDay").notNull(),
  preparationTime: integer("preparationTime").default(0), // in hours
  leadTime: integer("leadTime").default(0), // in days
});

export type OrderListItem = typeof orderListItems.$inferSelect;
export type InsertOrderListItem = typeof orderListItems.$inferInsert;

