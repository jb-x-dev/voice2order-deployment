import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertMenuPlan, InsertMenuPlanEntry, InsertRecipe, InsertRecipeIngredient, menuPlanEntries, menuPlans, recipeIngredients, recipes, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Recipe queries
export async function getUserRecipes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recipes).where(eq(recipes.userId, userId)).orderBy(desc(recipes.createdAt));
}

export async function getRecipeById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1);
  return result[0] || null;
}

export async function createRecipe(recipe: InsertRecipe) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(recipes).values(recipe);
  return result;
}

export async function updateRecipe(id: number, recipe: Partial<InsertRecipe>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(recipes).set(recipe).where(eq(recipes.id, id));
}

export async function deleteRecipe(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));
  await db.delete(recipes).where(eq(recipes.id, id));
}

// Recipe ingredient queries
export async function getRecipeIngredients(recipeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId));
}

export async function createRecipeIngredient(ingredient: InsertRecipeIngredient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(recipeIngredients).values(ingredient);
  return result;
}

export async function updateRecipeIngredient(id: number, ingredient: Partial<InsertRecipeIngredient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(recipeIngredients).set(ingredient).where(eq(recipeIngredients.id, id));
}

export async function deleteRecipeIngredient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(recipeIngredients).where(eq(recipeIngredients.id, id));
}

// Menu plan queries
export async function getUserMenuPlans(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuPlans).where(eq(menuPlans.userId, userId)).orderBy(desc(menuPlans.createdAt));
}

export async function getMenuPlanById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(menuPlans).where(eq(menuPlans.id, id)).limit(1);
  return result[0] || null;
}

export async function createMenuPlan(plan: InsertMenuPlan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(menuPlans).values(plan);
  return result;
}

export async function updateMenuPlan(id: number, plan: Partial<InsertMenuPlan>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(menuPlans).set(plan).where(eq(menuPlans.id, id));
}

export async function deleteMenuPlan(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(menuPlanEntries).where(eq(menuPlanEntries.menuPlanId, id));
  await db.delete(menuPlans).where(eq(menuPlans.id, id));
}

// Menu plan entry queries
export async function getMenuPlanEntries(menuPlanId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuPlanEntries).where(eq(menuPlanEntries.menuPlanId, menuPlanId));
}

export async function createMenuPlanEntry(entry: InsertMenuPlanEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(menuPlanEntries).values(entry);
  return result;
}

export async function updateMenuPlanEntry(id: number, entry: Partial<InsertMenuPlanEntry>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(menuPlanEntries).set(entry).where(eq(menuPlanEntries.id, id));
}

export async function deleteMenuPlanEntry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(menuPlanEntries).where(eq(menuPlanEntries.id, id));
}

export async function deleteMenuPlanEntriesByDate(menuPlanId: number, date: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(menuPlanEntries).where(
    and(
      eq(menuPlanEntries.menuPlanId, menuPlanId),
      eq(menuPlanEntries.date, date)
    )
  );
}
