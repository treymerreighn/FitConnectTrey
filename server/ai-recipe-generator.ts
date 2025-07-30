import OpenAI from "openai";
import { storage } from "./storage";
import type { Recipe } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface RecipeGenerationRequest {
  category: "breakfast" | "lunch" | "dinner" | "snack" | "dessert";
  dietaryTags?: string[];
  cuisineType?: string;
  difficulty?: "easy" | "medium" | "hard";
  maxCalories?: number;
  count?: number;
}

export async function generateHealthyRecipes(params: RecipeGenerationRequest): Promise<Recipe[]> {
  const { category, dietaryTags = [], cuisineType, difficulty = "easy", maxCalories, count = 5 } = params;

  try {
    console.log(`🍽️ Generating ${count} ${category} recipes...`);

    const dietaryFilter = dietaryTags.length > 0 ? `, following ${dietaryTags.join(", ")} dietary requirements` : "";
    const cuisineFilter = cuisineType ? `, focusing on ${cuisineType} cuisine` : "";
    const calorieFilter = maxCalories ? `, with maximum ${maxCalories} calories per serving` : "";

    const prompt = `Generate ${count} healthy ${category} recipes${dietaryFilter}${cuisineFilter}${calorieFilter}.

Each recipe should be ${difficulty} to prepare and include:
- Name (creative but descriptive)
- Brief description (1-2 sentences)
- Ingredients list (with quantities)
- Step-by-step instructions
- Prep time and cook time in minutes
- Number of servings
- Nutritional information (calories, protein, carbs, fat, fiber per serving)
- Dietary tags if applicable (vegetarian, vegan, gluten-free, dairy-free, low-carb, high-protein, etc.)

Focus on:
- Fresh, whole ingredients
- Balanced nutrition
- Clear, easy-to-follow instructions
- Realistic prep and cook times
- Appealing flavor combinations

Respond with a JSON array of recipe objects in this exact format:
{
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "Brief description",
      "ingredients": ["ingredient 1", "ingredient 2"],
      "instructions": ["step 1", "step 2"],
      "prepTime": 15,
      "cookTime": 20,
      "servings": 4,
      "difficulty": "${difficulty}",
      "cuisineType": "cuisine type",
      "dietaryTags": ["tag1", "tag2"],
      "calories": 350,
      "protein": 25,
      "carbs": 30,
      "fat": 12,
      "fiber": 8,
      "category": "${category}"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a professional nutritionist and chef. Generate healthy, delicious recipes with accurate nutritional information and clear instructions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!result.recipes || !Array.isArray(result.recipes)) {
      throw new Error("Invalid recipe format received from OpenAI");
    }

    // Convert to proper Recipe format and add to storage
    const recipes: Recipe[] = [];
    
    for (const recipeData of result.recipes) {
      const recipe: Recipe = {
        id: Math.random().toString(36).substring(2, 15),
        name: recipeData.name,
        description: recipeData.description,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        cookTime: recipeData.cookTime,
        prepTime: recipeData.prepTime,
        servings: recipeData.servings,
        difficulty: recipeData.difficulty,
        cuisineType: recipeData.cuisineType,
        dietaryTags: recipeData.dietaryTags || [],
        calories: recipeData.calories,
        protein: recipeData.protein,
        carbs: recipeData.carbs,
        fat: recipeData.fat,
        fiber: recipeData.fiber,
        image: undefined, // Will be generated separately
        isAiGenerated: true,
        category: category,
        createdAt: new Date(),
      };
      
      recipes.push(recipe);
      
      // Add to storage
      if (storage.addRecipe) {
        await storage.addRecipe(recipe);
        console.log(`✅ Added recipe: ${recipe.name}`);
      }
    }

    return recipes;

  } catch (error) {
    console.error("Error generating recipes:", error);
    
    // Fallback recipes for development
    const fallbackRecipes = getFallbackRecipes(category, count);
    
    for (const recipe of fallbackRecipes) {
      if (storage.addRecipe) {
        await storage.addRecipe(recipe);
      }
    }
    
    return fallbackRecipes;
  }
}

function getFallbackRecipes(category: string, count: number): Recipe[] {
  const fallbackData: Record<string, Partial<Recipe>[]> = {
    breakfast: [
      {
        name: "Overnight Oats with Berries",
        description: "Creamy overnight oats topped with fresh berries and a drizzle of honey",
        ingredients: ["1/2 cup rolled oats", "1/2 cup almond milk", "1 tbsp chia seeds", "1/2 cup mixed berries", "1 tsp honey"],
        instructions: ["Mix oats, milk, and chia seeds", "Refrigerate overnight", "Top with berries and honey"],
        prepTime: 5,
        cookTime: 0,
        servings: 1,
        difficulty: "easy",
        calories: 280,
        protein: 8,
        carbs: 45,
        fat: 6,
        fiber: 10
      },
      {
        name: "Avocado Toast with Egg",
        description: "Whole grain toast topped with mashed avocado and a perfectly cooked egg",
        ingredients: ["2 slices whole grain bread", "1 ripe avocado", "2 eggs", "Salt and pepper", "Red pepper flakes"],
        instructions: ["Toast bread", "Mash avocado with salt and pepper", "Cook eggs sunny side up", "Assemble and season"],
        prepTime: 5,
        cookTime: 10,
        servings: 1,
        difficulty: "easy",
        calories: 420,
        protein: 18,
        carbs: 32,
        fat: 25,
        fiber: 12
      }
    ],
    lunch: [
      {
        name: "Mediterranean Quinoa Bowl",
        description: "Fresh quinoa bowl with vegetables, olives, and feta cheese",
        ingredients: ["1 cup cooked quinoa", "1/2 cup cherry tomatoes", "1/2 cucumber", "1/4 cup olives", "2 oz feta cheese", "2 tbsp olive oil"],
        instructions: ["Prepare quinoa", "Dice vegetables", "Combine all ingredients", "Dress with olive oil"],
        prepTime: 15,
        cookTime: 15,
        servings: 2,
        difficulty: "easy",
        calories: 380,
        protein: 14,
        carbs: 45,
        fat: 16,
        fiber: 6
      }
    ],
    dinner: [
      {
        name: "Baked Salmon with Vegetables",
        description: "Herb-crusted salmon with roasted seasonal vegetables",
        ingredients: ["4 oz salmon fillet", "1 cup broccoli", "1/2 cup carrots", "2 tbsp olive oil", "Herbs and spices"],
        instructions: ["Preheat oven to 400°F", "Season salmon and vegetables", "Roast for 20 minutes", "Serve hot"],
        prepTime: 10,
        cookTime: 20,
        servings: 1,
        difficulty: "medium",
        calories: 420,
        protein: 35,
        carbs: 20,
        fat: 22,
        fiber: 8
      }
    ],
    snack: [
      {
        name: "Greek Yogurt Parfait",
        description: "Layered Greek yogurt with granola and fresh fruit",
        ingredients: ["1 cup Greek yogurt", "1/4 cup granola", "1/2 cup berries", "1 tsp honey"],
        instructions: ["Layer yogurt and granola", "Top with berries", "Drizzle with honey"],
        prepTime: 5,
        cookTime: 0,
        servings: 1,
        difficulty: "easy",
        calories: 220,
        protein: 15,
        carbs: 28,
        fat: 6,
        fiber: 4
      }
    ],
    dessert: [
      {
        name: "Dark Chocolate Energy Balls",
        description: "No-bake energy balls with dates, nuts, and dark chocolate",
        ingredients: ["1 cup dates", "1/2 cup almonds", "2 tbsp cocoa powder", "1 tsp vanilla"],
        instructions: ["Process dates and almonds", "Add cocoa and vanilla", "Form into balls", "Chill for 30 minutes"],
        prepTime: 15,
        cookTime: 0,
        servings: 8,
        difficulty: "easy",
        calories: 95,
        protein: 3,
        carbs: 12,
        fat: 5,
        fiber: 3
      }
    ]
  };

  const recipesForCategory = fallbackData[category] || fallbackData.breakfast;
  
  return recipesForCategory.slice(0, count).map((recipe, index) => ({
    id: `fallback-${category}-${index}`,
    name: recipe.name || "Healthy Recipe",
    description: recipe.description,
    ingredients: recipe.ingredients || [],
    instructions: recipe.instructions || [],
    cookTime: recipe.cookTime || 20,
    prepTime: recipe.prepTime || 10,
    servings: recipe.servings || 2,
    difficulty: recipe.difficulty || "easy",
    cuisineType: "international",
    dietaryTags: [],
    calories: recipe.calories,
    protein: recipe.protein,
    carbs: recipe.carbs,
    fat: recipe.fat,
    fiber: recipe.fiber,
    image: undefined,
    isAiGenerated: false,
    category: category as any,
    createdAt: new Date(),
  }));
}

export async function buildRecipeDatabase() {
  console.log("🚀 Building healthy recipes database with OpenAI...");
  
  try {
    const categories: Array<"breakfast" | "lunch" | "dinner" | "snack" | "dessert"> = 
      ["breakfast", "lunch", "dinner", "snack", "dessert"];
    
    for (const category of categories) {
      await generateHealthyRecipes({
        category,
        count: 6,
        difficulty: "easy"
      });
      
      // Add some medium difficulty recipes
      await generateHealthyRecipes({
        category,
        count: 3,
        difficulty: "medium"
      });
    }
    
    console.log("🎉 Healthy recipes database built successfully!");
    
  } catch (error) {
    console.error("Error building recipe database:", error);
  }
}