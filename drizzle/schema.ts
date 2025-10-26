import { boolean, date, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Recipes table - stores recipe information
 */
export const recipes = mysqlTable("recipes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["hauptgericht", "beilage", "dessert", "vorspeise", "getraenk", "sonstiges"]).default("hauptgericht").notNull(),
  defaultPortions: int("defaultPortions").default(4).notNull(),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = typeof recipes.$inferInsert;

/**
 * Recipe ingredients table - stores ingredients for each recipe
 */
export const recipeIngredients = mysqlTable("recipeIngredients", {
  id: int("id").autoincrement().primaryKey(),
  recipeId: int("recipeId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: varchar("quantity", { length: 100 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  pricePerUnit: int("pricePerUnit").default(0), // in cents
  notes: text("notes"),
});

export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type InsertRecipeIngredient = typeof recipeIngredients.$inferInsert;

/**
 * Menu plans table - stores weekly/monthly menu plans
 */
export const menuPlans = mysqlTable("menuPlans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["entwurf", "vorlage", "aktiv", "archiviert"]).default("entwurf").notNull(),
  maxBudgetPerDay: int("maxBudgetPerDay").default(0), // in cents
  budgetTolerance: decimal("budgetTolerance", { precision: 5, scale: 2 }).default("10.00"), // in percent
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MenuPlan = typeof menuPlans.$inferSelect;
export type InsertMenuPlan = typeof menuPlans.$inferInsert;

/**
 * Menu plan entries table - stores individual meals in a menu plan
 */
export const menuPlanEntries = mysqlTable("menuPlanEntries", {
  id: int("id").autoincrement().primaryKey(),
  menuPlanId: int("menuPlanId").notNull(),
  date: timestamp("date").notNull(),
  mealType: mysqlEnum("mealType", ["fruehstueck", "mittagessen", "abendessen", "snack"]).notNull(),
  recipeId: int("recipeId").notNull(),
  portions: int("portions").default(4).notNull(),
  notes: text("notes"),
});

export type MenuPlanEntry = typeof menuPlanEntries.$inferSelect;
export type InsertMenuPlanEntry = typeof menuPlanEntries.$inferInsert;

/**
 * Menu plan recipes table - stores multiple recipes per meal entry
 */
export const menuPlanRecipes = mysqlTable("menuPlanRecipes", {
  id: int("id").autoincrement().primaryKey(),
  entryId: int("entryId").notNull(),
  recipeId: int("recipeId").notNull(),
  portions: int("portions").default(4).notNull(),
  isSelected: boolean("isSelected").default(true),
  isAlternative: boolean("isAlternative").default(false),
  sortOrder: int("sortOrder").default(0),
});

export type MenuPlanRecipe = typeof menuPlanRecipes.$inferSelect;
export type InsertMenuPlanRecipe = typeof menuPlanRecipes.$inferInsert;

/**
 * Order lists table - stores procurement order lists
 */
export const orderLists = mysqlTable("orderLists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  menuPlanId: int("menuPlanId"),
  name: varchar("name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["entwurf", "bestaetigt", "bestellt", "archiviert"]).default("entwurf").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrderList = typeof orderLists.$inferSelect;
export type InsertOrderList = typeof orderLists.$inferInsert;

/**
 * Order list items table - stores items in an order list
 */
export const orderListItems = mysqlTable("orderListItems", {
  id: int("id").autoincrement().primaryKey(),
  orderListId: int("orderListId").notNull(),
  recipeId: int("recipeId").notNull(),
  portions: int("portions").notNull(),
  orderDay: date("orderDay").notNull(),
  preparationTime: int("preparationTime").default(0), // in hours
  leadTime: int("leadTime").default(0), // in days
});

export type OrderListItem = typeof orderListItems.$inferSelect;
export type InsertOrderListItem = typeof orderListItems.$inferInsert;

