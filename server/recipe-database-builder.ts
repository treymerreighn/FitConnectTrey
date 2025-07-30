import { buildRecipeDatabase } from "./ai-recipe-generator";
import { storage } from "./storage";

export async function initializeRecipeDatabase() {
  try {
    // Check if recipes already exist
    const existingRecipes = await storage.getAllRecipes();
    
    if (existingRecipes.length > 0) {
      console.log(`📊 Recipe database already has ${existingRecipes.length} recipes`);
      return;
    }
    
    console.log("🍽️ Initializing healthy recipes database...");
    await buildRecipeDatabase();
    
    const totalRecipes = await storage.getAllRecipes();
    console.log(`🎉 Recipe database initialized with ${totalRecipes.length} healthy recipes!`);
    
  } catch (error) {
    console.error("Error initializing recipe database:", error);
    
    // Add some fallback recipes if AI generation fails
    console.log("📝 Adding fallback recipes...");
    await addFallbackRecipes();
  }
}

async function addFallbackRecipes() {
  const fallbackRecipes = [
    {
      id: "overnight-oats-berry",
      name: "Overnight Oats with Mixed Berries",
      description: "Creamy overnight oats topped with antioxidant-rich berries and a drizzle of honey",
      ingredients: [
        "1/2 cup rolled oats",
        "1/2 cup almond milk",
        "1 tbsp chia seeds",
        "1/2 cup mixed berries",
        "1 tsp honey",
        "1/4 tsp vanilla extract"
      ],
      instructions: [
        "Combine oats, almond milk, chia seeds, and vanilla in a jar",
        "Stir well and refrigerate overnight",
        "In the morning, top with berries and honey",
        "Enjoy cold or at room temperature"
      ],
      prepTime: 5,
      cookTime: 0,
      servings: 1,
      difficulty: "easy" as const,
      cuisineType: "american",
      dietaryTags: ["vegetarian", "gluten-free", "high-fiber"],
      calories: 280,
      protein: 8,
      carbs: 45,
      fat: 6,
      fiber: 10,
      category: "breakfast" as const,
      isAiGenerated: false,
      createdAt: new Date(),
    },
    {
      id: "quinoa-power-bowl",
      name: "Mediterranean Quinoa Power Bowl",
      description: "Nutrient-packed quinoa bowl with fresh vegetables, chickpeas, and tahini dressing",
      ingredients: [
        "1 cup cooked quinoa",
        "1/2 cup chickpeas",
        "1/2 cucumber, diced",
        "1/2 cup cherry tomatoes",
        "1/4 cup red onion",
        "2 tbsp tahini",
        "1 lemon, juiced",
        "2 tbsp olive oil"
      ],
      instructions: [
        "Cook quinoa according to package directions",
        "Dice cucumber, tomatoes, and red onion",
        "Whisk tahini, lemon juice, and olive oil for dressing",
        "Combine all ingredients in a bowl",
        "Drizzle with dressing and serve"
      ],
      prepTime: 15,
      cookTime: 15,
      servings: 2,
      difficulty: "easy" as const,
      cuisineType: "mediterranean",
      dietaryTags: ["vegan", "gluten-free", "high-protein"],
      calories: 380,
      protein: 14,
      carbs: 45,
      fat: 16,
      fiber: 8,
      category: "lunch" as const,
      isAiGenerated: false,
      createdAt: new Date(),
    },
    {
      id: "baked-salmon-vegetables",
      name: "Herb-Crusted Baked Salmon with Roasted Vegetables",
      description: "Flaky salmon fillet with a fresh herb crust, served with colorful roasted vegetables",
      ingredients: [
        "4 oz salmon fillet",
        "1 cup broccoli florets",
        "1/2 cup carrots, sliced",
        "1/2 zucchini, sliced",
        "2 tbsp olive oil",
        "1 tsp dried herbs",
        "Salt and pepper to taste"
      ],
      instructions: [
        "Preheat oven to 400°F (200°C)",
        "Season salmon with herbs, salt, and pepper",
        "Toss vegetables with olive oil and seasonings",
        "Place salmon and vegetables on baking sheet",
        "Bake for 18-20 minutes until salmon flakes easily",
        "Serve hot"
      ],
      prepTime: 10,
      cookTime: 20,
      servings: 1,
      difficulty: "medium" as const,
      cuisineType: "american",
      dietaryTags: ["gluten-free", "high-protein", "omega-3"],
      calories: 420,
      protein: 35,
      carbs: 20,
      fat: 22,
      fiber: 8,
      category: "dinner" as const,
      isAiGenerated: false,
      createdAt: new Date(),
    },
    {
      id: "green-smoothie-bowl",
      name: "Tropical Green Smoothie Bowl",
      description: "Refreshing green smoothie bowl topped with tropical fruits and crunchy granola",
      ingredients: [
        "1 frozen banana",
        "1/2 cup spinach",
        "1/2 cup mango chunks",
        "1/4 cup coconut milk",
        "1 tbsp chia seeds",
        "1/4 cup granola",
        "2 tbsp coconut flakes"
      ],
      instructions: [
        "Blend banana, spinach, mango, and coconut milk until smooth",
        "Pour into a bowl",
        "Top with chia seeds, granola, and coconut flakes",
        "Serve immediately"
      ],
      prepTime: 10,
      cookTime: 0,
      servings: 1,
      difficulty: "easy" as const,
      cuisineType: "tropical",
      dietaryTags: ["vegan", "gluten-free", "antioxidant-rich"],
      calories: 320,
      protein: 8,
      carbs: 52,
      fat: 12,
      fiber: 12,
      category: "breakfast" as const,
      isAiGenerated: false,
      createdAt: new Date(),
    },
    {
      id: "dark-chocolate-energy-bites",
      name: "Dark Chocolate Protein Energy Bites",
      description: "No-bake energy bites with dates, almonds, and dark chocolate - perfect healthy snack",
      ingredients: [
        "1 cup pitted dates",
        "1/2 cup raw almonds",
        "2 tbsp cocoa powder",
        "1 tbsp protein powder",
        "1 tsp vanilla extract",
        "1 tbsp coconut oil"
      ],
      instructions: [
        "Soak dates in warm water for 10 minutes",
        "Process almonds in food processor until chopped",
        "Add drained dates and process until paste forms",
        "Add cocoa powder, protein powder, vanilla, and coconut oil",
        "Form mixture into 12 balls",
        "Refrigerate for 30 minutes before serving"
      ],
      prepTime: 20,
      cookTime: 0,
      servings: 6,
      difficulty: "easy" as const,
      cuisineType: "american",
      dietaryTags: ["vegan", "gluten-free", "high-protein"],
      calories: 95,
      protein: 4,
      carbs: 12,
      fat: 5,
      fiber: 3,
      category: "snack" as const,
      isAiGenerated: false,
      createdAt: new Date(),
    }
  ];

  for (const recipe of fallbackRecipes) {
    try {
      await storage.addRecipe(recipe);
      console.log(`✅ Added fallback recipe: ${recipe.name}`);
    } catch (error) {
      console.error(`Error adding fallback recipe ${recipe.name}:`, error);
    }
  }
}