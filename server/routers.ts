import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  recipes: router({
    list: protectedProcedure.query(({ ctx }) => db.getUserRecipes(ctx.user.id)),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const recipe = await db.getRecipeById(input.id);
        if (!recipe || recipe.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const ingredients = await db.getRecipeIngredients(input.id);
        return { ...recipe, ingredients };
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(["hauptgericht", "beilage", "dessert", "vorspeise", "getraenk", "sonstiges"]),
        defaultPortions: z.number().min(1).max(500),
        imageUrl: z.string().optional(),
        ingredients: z.array(z.object({
          name: z.string(),
          quantity: z.string(),
          unit: z.string(),
          pricePerUnit: z.number().optional(),
          notes: z.string().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const { ingredients, ...recipeData } = input;
        const result = await db.createRecipe({ ...recipeData, userId: ctx.user.id });
        const recipeId = Number((result as any).insertId);
        
        for (const ingredient of ingredients) {
          await db.createRecipeIngredient({
            recipeId,
            ...ingredient,
            pricePerUnit: ingredient.pricePerUnit || 0,
          });
        }
        
        return { id: recipeId };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        category: z.enum(["hauptgericht", "beilage", "dessert", "vorspeise", "getraenk", "sonstiges"]).optional(),
        defaultPortions: z.number().min(1).max(500).optional(),
        imageUrl: z.string().optional(),
        ingredients: z.array(z.object({
          id: z.number().optional(),
          name: z.string(),
          quantity: z.string(),
          unit: z.string(),
          pricePerUnit: z.number().optional(),
          notes: z.string().optional(),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const recipe = await db.getRecipeById(input.id);
        if (!recipe || recipe.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const { id, ingredients, ...updateData } = input;
        await db.updateRecipe(id, updateData);
        
        if (ingredients) {
          const existingIngredients = await db.getRecipeIngredients(id);
          const existingIds = new Set(existingIngredients.map(i => i.id));
          const inputIds = new Set(ingredients.filter(i => i.id).map(i => i.id!));
          
          for (const existingId of Array.from(existingIds)) {
            if (!inputIds.has(existingId)) {
              await db.deleteRecipeIngredient(existingId);
            }
          }
          
          for (const ingredient of ingredients) {
            if (ingredient.id) {
              await db.updateRecipeIngredient(ingredient.id, {
                name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                pricePerUnit: ingredient.pricePerUnit || 0,
                notes: ingredient.notes,
              });
            } else {
              await db.createRecipeIngredient({
                recipeId: id,
                name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                pricePerUnit: ingredient.pricePerUnit || 0,
                notes: ingredient.notes,
              });
            }
          }
        }
        
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const recipe = await db.getRecipeById(input.id);
        if (!recipe || recipe.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        await db.deleteRecipe(input.id);
        return { success: true };
      }),
  }),
  
  menuPlans: router({
    list: protectedProcedure.query(({ ctx }) => db.getUserMenuPlans(ctx.user.id)),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const plan = await db.getMenuPlanById(input.id);
        if (!plan || plan.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const entries = await db.getMenuPlanEntries(input.id);
        
        const enrichedEntries = await Promise.all(
          entries.map(async (entry) => {
            const recipe = await db.getRecipeById(entry.recipeId);
            const ingredients = await db.getRecipeIngredients(entry.recipeId);
            return { ...entry, recipe: { ...recipe, ingredients } };
          })
        );
        
        return { ...plan, entries: enrichedEntries };
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        startDate: z.date(),
        endDate: z.date(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.createMenuPlan({ ...input, userId: ctx.user.id });
        return { id: Number((result as any).insertId) };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const plan = await db.getMenuPlanById(input.id);
        if (!plan || plan.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const { id, ...updateData } = input;
        await db.updateMenuPlan(id, updateData);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const plan = await db.getMenuPlanById(input.id);
        if (!plan || plan.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        await db.deleteMenuPlan(input.id);
        return { success: true };
      }),
    
    addEntry: protectedProcedure
      .input(z.object({
        menuPlanId: z.number(),
        date: z.date(),
        mealType: z.enum(["fruehstueck", "mittagessen", "abendessen", "snack"]),
        recipeId: z.number(),
        portions: z.number().min(1).max(500),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const plan = await db.getMenuPlanById(input.menuPlanId);
        if (!plan || plan.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const result = await db.createMenuPlanEntry(input);
        return { id: Number((result as any).insertId) };
      }),
    
    updateEntry: protectedProcedure
      .input(z.object({
        id: z.number(),
        portions: z.number().min(1).max(500).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        await db.updateMenuPlanEntry(id, updateData);
        return { success: true };
      }),
    
    deleteEntry: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMenuPlanEntry(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
