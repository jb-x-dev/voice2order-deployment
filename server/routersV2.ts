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
            const additionalRecipes = await db.getMenuPlanRecipes(entry.id);
            
            const enrichedAdditionalRecipes = await Promise.all(
              additionalRecipes.map(async (mr) => {
                const r = await db.getRecipeById(mr.recipeId);
                const ing = await db.getRecipeIngredients(mr.recipeId);
                return { ...mr, recipe: { ...r, ingredients: ing } };
              })
            );
            
            return { 
              ...entry, 
              recipe: { ...recipe, ingredients },
              additionalRecipes: enrichedAdditionalRecipes,
            };
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
        status: z.enum(["entwurf", "vorlage", "aktiv", "archiviert"]).optional(),
        maxBudgetPerDay: z.number().optional(),
        budgetTolerance: z.number().optional(),
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
        status: z.enum(["entwurf", "vorlage", "aktiv", "archiviert"]).optional(),
        maxBudgetPerDay: z.number().optional(),
        budgetTolerance: z.number().optional(),
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
    
    duplicate: protectedProcedure
      .input(z.object({
        id: z.number(),
        newStartDate: z.date(),
        newEndDate: z.date(),
      }))
      .mutation(async ({ input, ctx }) => {
        const plan = await db.getMenuPlanById(input.id);
        if (!plan || plan.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const entries = await db.getMenuPlanEntries(input.id);
        
        const newPlan = await db.createMenuPlan({
          userId: ctx.user.id,
          name: `${plan.name} (Kopie)`,
          startDate: input.newStartDate,
          endDate: input.newEndDate,
          description: plan.description,
          status: plan.status,
          maxBudgetPerDay: plan.maxBudgetPerDay,
          budgetTolerance: plan.budgetTolerance,
        });
        
        const newPlanId = Number((newPlan as any).insertId);
        
        const daysDiff = Math.floor(
          (input.newStartDate.getTime() - new Date(plan.startDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        for (const entry of entries) {
          const newDate = new Date(entry.date);
          newDate.setDate(newDate.getDate() + daysDiff);
          
          const newEntry = await db.createMenuPlanEntry({
            menuPlanId: newPlanId,
            date: newDate,
            mealType: entry.mealType,
            recipeId: entry.recipeId,
            portions: entry.portions,
            notes: entry.notes,
          });
          
          const newEntryId = Number((newEntry as any).insertId);
          
          const additionalRecipes = await db.getMenuPlanRecipes(entry.id);
          for (const recipe of additionalRecipes) {
            await db.createMenuPlanRecipe({
              entryId: newEntryId,
              recipeId: recipe.recipeId,
              portions: recipe.portions,
              isSelected: recipe.isSelected,
              isAlternative: recipe.isAlternative,
              sortOrder: recipe.sortOrder,
            });
          }
        }
        
        return { id: newPlanId };
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
        await db.deleteMenuPlanRecipesByEntry(input.id);
        await db.deleteMenuPlanEntry(input.id);
        return { success: true };
      }),
    
    addRecipeToEntry: protectedProcedure
      .input(z.object({
        entryId: z.number(),
        recipeId: z.number(),
        portions: z.number().min(1).max(500),
        isAlternative: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const recipes = await db.getMenuPlanRecipes(input.entryId);
        const sortOrder = recipes.length;
        
        const result = await db.createMenuPlanRecipe({
          entryId: input.entryId,
          recipeId: input.recipeId,
          portions: input.portions,
          isSelected: true,
          isAlternative: input.isAlternative || false,
          sortOrder,
        });
        
        return { id: Number((result as any).insertId) };
      }),
    
    updateRecipeInEntry: protectedProcedure
      .input(z.object({
        id: z.number(),
        portions: z.number().min(1).max(500).optional(),
        isSelected: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        await db.updateMenuPlanRecipe(id, updateData);
        return { success: true };
      }),
    
    removeRecipeFromEntry: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMenuPlanRecipe(input.id);
        return { success: true };
      }),
  }),
  
  orderLists: router({
    list: protectedProcedure.query(({ ctx }) => db.getUserOrderLists(ctx.user.id)),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const orderList = await db.getOrderListById(input.id);
        if (!orderList || orderList.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const items = await db.getOrderListItems(input.id);
        
        const enrichedItems = await Promise.all(
          items.map(async (item) => {
            const recipe = await db.getRecipeById(item.recipeId);
            const ingredients = await db.getRecipeIngredients(item.recipeId);
            return { ...item, recipe: { ...recipe, ingredients } };
          })
        );
        
        return { ...orderList, items: enrichedItems };
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        menuPlanId: z.number().optional(),
        status: z.enum(["entwurf", "bestaetigt", "bestellt", "archiviert"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.createOrderList({ ...input, userId: ctx.user.id });
        return { id: Number((result as any).insertId) };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        status: z.enum(["entwurf", "bestaetigt", "bestellt", "archiviert"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const orderList = await db.getOrderListById(input.id);
        if (!orderList || orderList.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const { id, ...updateData } = input;
        await db.updateOrderList(id, updateData);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const orderList = await db.getOrderListById(input.id);
        if (!orderList || orderList.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        await db.deleteOrderList(input.id);
        return { success: true };
      }),
    
    generateFromMenuPlan: protectedProcedure
      .input(z.object({
        menuPlanId: z.number(),
        name: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const plan = await db.getMenuPlanById(input.menuPlanId);
        if (!plan || plan.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const entries = await db.getMenuPlanEntries(input.menuPlanId);
        
        const orderListName = input.name || `Bestellliste ${new Date().toLocaleDateString('de-DE')}`;
        
        const orderList = await db.createOrderList({
          userId: ctx.user.id,
          menuPlanId: input.menuPlanId,
          name: orderListName,
          status: "entwurf",
        });
        
        const orderListId = Number((orderList as any).insertId);
        
        for (const entry of entries) {
          const entryDate = new Date(entry.date);
          
          await db.createOrderListItem({
            orderListId,
            recipeId: entry.recipeId,
            portions: entry.portions,
            orderDay: entryDate,
            preparationTime: 0,
            leadTime: 0,
          });
          
          const additionalRecipes = await db.getMenuPlanRecipes(entry.id);
          for (const recipe of additionalRecipes.filter(r => r.isSelected)) {
            await db.createOrderListItem({
              orderListId,
              recipeId: recipe.recipeId,
              portions: recipe.portions,
              orderDay: entryDate,
              preparationTime: 0,
              leadTime: 0,
            });
          }
        }
        
        return { id: orderListId };
      }),
  }),
});

export type AppRouter = typeof appRouter;

