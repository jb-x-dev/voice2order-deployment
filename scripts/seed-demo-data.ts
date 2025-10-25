import { drizzle } from "drizzle-orm/mysql2";
import { recipes, recipeIngredients, users } from "../drizzle/schema";

async function seedDemoData() {
  const db = drizzle(process.env.DATABASE_URL!);

  console.log("🌱 Seeding demo data...");

  // Demo recipes
  const demoRecipes = [
    {
      name: "Spaghetti Bolognese",
      description: "Klassische italienische Pasta mit Hackfleischsauce",
      category: "hauptgericht" as const,
      defaultPortions: 4,
      userId: 1,
    },
    {
      name: "Gemischter Salat",
      description: "Frischer Salat mit Tomaten, Gurken und Dressing",
      category: "beilage" as const,
      defaultPortions: 4,
      userId: 1,
    },
    {
      name: "Tiramisu",
      description: "Italienisches Dessert mit Mascarpone und Kaffee",
      category: "dessert" as const,
      defaultPortions: 6,
      userId: 1,
    },
    {
      name: "Hühnersuppe",
      description: "Hausgemachte Hühnerbrühe mit Gemüse",
      category: "vorspeise" as const,
      defaultPortions: 4,
      userId: 1,
    },
    {
      name: "Schnitzel mit Pommes",
      description: "Paniertes Schnitzel mit knusprigen Pommes frites",
      category: "hauptgericht" as const,
      defaultPortions: 4,
      userId: 1,
    },
    {
      name: "Kartoffelpüree",
      description: "Cremiges Kartoffelpüree mit Butter",
      category: "beilage" as const,
      defaultPortions: 4,
      userId: 1,
    },
    {
      name: "Apfelstrudel",
      description: "Traditioneller österreichischer Apfelstrudel",
      category: "dessert" as const,
      defaultPortions: 8,
      userId: 1,
    },
    {
      name: "Gulaschsuppe",
      description: "Deftige ungarische Gulaschsuppe",
      category: "hauptgericht" as const,
      defaultPortions: 6,
      userId: 1,
    },
  ];

  for (const recipe of demoRecipes) {
    const result: any = await db.insert(recipes).values(recipe);
    const recipeId = result[0]?.insertId || result.insertId;

    // Add ingredients based on recipe
    let ingredients: any[] = [];

    switch (recipe.name) {
      case "Spaghetti Bolognese":
        ingredients = [
          { name: "Spaghetti", quantity: "500", unit: "g", pricePerUnit: 150 },
          { name: "Hackfleisch", quantity: "400", unit: "g", pricePerUnit: 450 },
          { name: "Tomaten", quantity: "400", unit: "g", pricePerUnit: 200 },
          { name: "Zwiebeln", quantity: "2", unit: "Stück", pricePerUnit: 30 },
          { name: "Knoblauch", quantity: "2", unit: "Zehen", pricePerUnit: 10 },
        ];
        break;
      case "Gemischter Salat":
        ingredients = [
          { name: "Kopfsalat", quantity: "1", unit: "Stück", pricePerUnit: 120 },
          { name: "Tomaten", quantity: "200", unit: "g", pricePerUnit: 100 },
          { name: "Gurke", quantity: "1", unit: "Stück", pricePerUnit: 80 },
          { name: "Dressing", quantity: "100", unit: "ml", pricePerUnit: 150 },
        ];
        break;
      case "Tiramisu":
        ingredients = [
          { name: "Mascarpone", quantity: "500", unit: "g", pricePerUnit: 450 },
          { name: "Löffelbiskuits", quantity: "200", unit: "g", pricePerUnit: 250 },
          { name: "Espresso", quantity: "200", unit: "ml", pricePerUnit: 100 },
          { name: "Eier", quantity: "4", unit: "Stück", pricePerUnit: 40 },
          { name: "Zucker", quantity: "100", unit: "g", pricePerUnit: 50 },
        ];
        break;
      case "Hühnersuppe":
        ingredients = [
          { name: "Hühnerbrühe", quantity: "1", unit: "l", pricePerUnit: 300 },
          { name: "Hühnerfleisch", quantity: "300", unit: "g", pricePerUnit: 400 },
          { name: "Karotten", quantity: "200", unit: "g", pricePerUnit: 80 },
          { name: "Sellerie", quantity: "100", unit: "g", pricePerUnit: 60 },
          { name: "Nudeln", quantity: "100", unit: "g", pricePerUnit: 80 },
        ];
        break;
      case "Schnitzel mit Pommes":
        ingredients = [
          { name: "Schweineschnitzel", quantity: "600", unit: "g", pricePerUnit: 800 },
          { name: "Paniermehl", quantity: "100", unit: "g", pricePerUnit: 100 },
          { name: "Eier", quantity: "2", unit: "Stück", pricePerUnit: 40 },
          { name: "Pommes frites", quantity: "500", unit: "g", pricePerUnit: 200 },
          { name: "Öl", quantity: "100", unit: "ml", pricePerUnit: 150 },
        ];
        break;
      case "Kartoffelpüree":
        ingredients = [
          { name: "Kartoffeln", quantity: "800", unit: "g", pricePerUnit: 120 },
          { name: "Butter", quantity: "50", unit: "g", pricePerUnit: 80 },
          { name: "Milch", quantity: "200", unit: "ml", pricePerUnit: 100 },
          { name: "Salz", quantity: "5", unit: "g", pricePerUnit: 5 },
        ];
        break;
      case "Apfelstrudel":
        ingredients = [
          { name: "Strudelteig", quantity: "250", unit: "g", pricePerUnit: 200 },
          { name: "Äpfel", quantity: "600", unit: "g", pricePerUnit: 180 },
          { name: "Zucker", quantity: "80", unit: "g", pricePerUnit: 40 },
          { name: "Zimt", quantity: "10", unit: "g", pricePerUnit: 30 },
          { name: "Rosinen", quantity: "50", unit: "g", pricePerUnit: 100 },
        ];
        break;
      case "Gulaschsuppe":
        ingredients = [
          { name: "Rindfleisch", quantity: "500", unit: "g", pricePerUnit: 600 },
          { name: "Paprika", quantity: "200", unit: "g", pricePerUnit: 150 },
          { name: "Zwiebeln", quantity: "200", unit: "g", pricePerUnit: 60 },
          { name: "Tomatenmark", quantity: "50", unit: "g", pricePerUnit: 80 },
          { name: "Paprikapulver", quantity: "20", unit: "g", pricePerUnit: 50 },
        ];
        break;
    }

    for (const ingredient of ingredients) {
      await db.insert(recipeIngredients).values({
        recipeId,
        ...ingredient,
      });
    }

    console.log(`✅ Created recipe: ${recipe.name}`);
  }

  console.log("✨ Demo data seeded successfully!");
}

seedDemoData().catch(console.error);

