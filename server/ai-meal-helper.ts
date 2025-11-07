import OpenAI from "openai";
import { nanoid } from "nanoid";
import type { Recipe } from "../shared/schema.ts";

let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

interface MealHelperParams {
  preferences?: string;
  dietaryRestrictions?: string[];
  cuisineType?: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | "dessert";
  servings?: number;
  difficulty?: "easy" | "medium" | "hard";
  healthGoals?: string[];
  availableIngredients?: string[];
}

export async function generatePersonalizedRecipe(params: MealHelperParams): Promise<Recipe> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is required for Meal Helper");
  }

  const {
    preferences = "",
    dietaryRestrictions = [],
    cuisineType = "any",
    mealType,
    servings = 2,
    difficulty = "easy",
    healthGoals = [],
    availableIngredients = []
  } = params;

  // Check if this is a regeneration request
  const isRegeneration = (params as any).regenerate && (params as any).previousRecipeId;
  
  const prompt = `Create a personalized healthy recipe based on these requirements:

${isRegeneration ? "🔄 REGENERATION MODE: Create a completely different recipe that meets the same preferences but is unique from the previous recipe. Use different ingredients, cooking methods, and flavors while maintaining the same dietary requirements and meal type.\n" : ""}

MEAL TYPE: ${mealType}
PREFERENCES: ${preferences || "No specific preferences"}
DIETARY RESTRICTIONS: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(", ") : "None"}
CUISINE TYPE: ${cuisineType}
SERVINGS: ${servings}
COOKING TIME: Maximum 30 minutes
DIFFICULTY: ${difficulty}
HEALTH GOALS: ${healthGoals.length > 0 ? healthGoals.join(", ") : "General health"}
AVAILABLE INGREDIENTS: ${availableIngredients.length > 0 ? availableIngredients.join(", ") : "Use any ingredients"}

Please create a detailed, healthy recipe that meets these requirements. The recipe should be nutritious, delicious, and practical to make.

Respond with a JSON object in this exact format:
{
  "name": "Recipe Name",
  "description": "Brief appetizing description of the dish",
  "ingredients": ["ingredient 1", "ingredient 2", "etc"],
  "instructions": ["step 1", "step 2", "etc"],
  "prepTime": number_in_minutes,
  "cookTime": number_in_minutes,
  "servings": number_of_servings,
  "difficulty": "easy|medium|hard",
  "cuisineType": "cuisine_type",
  "dietaryTags": ["tag1", "tag2", "etc"],
  "calories": estimated_calories_per_serving,
  "protein": grams_of_protein,
  "carbs": grams_of_carbs,
  "fat": grams_of_fat,
  "fiber": grams_of_fiber,
  "healthBenefits": ["benefit1", "benefit2", "etc"],
  "tips": ["tip1", "tip2", "etc"]
}`;

  try {
    console.log("🤖 Generating personalized recipe with OpenAI...");
    
    if (!openai) {
      throw new Error("OPENAI_API_KEY not set; AI features are disabled in this environment.");
    }
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a professional nutritionist and chef who creates healthy, personalized recipes. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const recipeData = JSON.parse(response.choices[0].message.content || "{}");
    console.log("Raw OpenAI response:", recipeData);
    
    const recipe: Recipe = {
      id: nanoid(),
      name: recipeData.name || `Healthy ${mealType} Recipe`,
      description: recipeData.description || "A delicious and nutritious meal",
      ingredients: recipeData.ingredients || [],
      instructions: recipeData.instructions || [],
      prepTime: recipeData.prepTime || 15,
      cookTime: recipeData.cookTime || 15,
      servings: recipeData.servings || servings,
      difficulty: recipeData.difficulty || difficulty,
      cuisineType: recipeData.cuisineType || cuisineType,
      dietaryTags: recipeData.dietaryTags || [],
      calories: recipeData.calories || 300,
      protein: recipeData.protein || 15,
      carbs: recipeData.carbs || 30,
      fat: recipeData.fat || 10,
      fiber: recipeData.fiber || 5,
      category: mealType,
      isAiGenerated: true,
      healthBenefits: recipeData.healthBenefits || [],
      tips: recipeData.tips || [],
      createdAt: new Date(),
    };
    
    console.log("Final recipe object:", recipe);

    console.log(`✅ Generated personalized recipe: ${recipe.name}`);
    return recipe;
    
  } catch (error) {
    console.error("Error generating personalized recipe:", error);
    
    // Fallback recipe based on meal type
    const fallbackRecipes = {
      breakfast: {
        name: "Healthy Breakfast Bowl",
        description: "A nutritious start to your day with balanced proteins and fiber",
        ingredients: ["1 cup oats", "1/2 cup berries", "1 tbsp nuts", "1 tbsp honey"],
        instructions: ["Cook oats", "Add toppings", "Enjoy"],
      },
      lunch: {
        name: "Power Lunch Salad", 
        description: "Energizing salad with lean protein and fresh vegetables",
        ingredients: ["2 cups greens", "1/2 cup protein", "1/4 cup nuts", "2 tbsp dressing"],
        instructions: ["Mix greens", "Add protein", "Drizzle dressing"],
      },
      dinner: {
        name: "Balanced Dinner Plate",
        description: "Well-rounded meal with lean protein and vegetables",
        ingredients: ["4 oz protein", "1 cup vegetables", "1/2 cup grains", "1 tbsp oil"],
        instructions: ["Cook protein", "Steam vegetables", "Serve with grains"],
      },
      snack: {
        name: "Healthy Snack",
        description: "Nutritious snack to keep you energized",
        ingredients: ["1 piece fruit", "1 tbsp nut butter"],
        instructions: ["Slice fruit", "Serve with nut butter"],
      },
      dessert: {
        name: "Guilt-Free Dessert",
        description: "Sweet treat that's also nutritious",
        ingredients: ["1 banana", "1 tbsp dark chocolate", "1 tsp nuts"],
        instructions: ["Slice banana", "Melt chocolate", "Drizzle and top with nuts"],
      }
    };

    const fallback = fallbackRecipes[mealType];
    
    return {
      id: nanoid(),
      name: fallback.name,
      description: fallback.description,
      ingredients: fallback.ingredients,
      instructions: fallback.instructions,
      prepTime: 10,
      cookTime: 10,
      servings: servings,
      difficulty: difficulty,
      cuisineType: cuisineType,
      dietaryTags: dietaryRestrictions,
      calories: 250,
      protein: 10,
      carbs: 25,
      fat: 8,
      fiber: 5,
      category: mealType,
      isAiGenerated: true,
      healthBenefits: ["Nutritious", "Balanced"],
      tips: ["Customize to your taste"],
      createdAt: new Date(),
    };
  }
}

export async function generateMultipleRecipes(params: MealHelperParams, count: number = 3): Promise<Recipe[]> {
  const recipes: Recipe[] = [];
  
  for (let i = 0; i < count; i++) {
    try {
      const recipe = await generatePersonalizedRecipe({
        ...params,
        preferences: `${params.preferences} - Option ${i + 1}`
      });
      recipes.push(recipe);
      
      // Small delay to avoid rate limiting
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error generating recipe ${i + 1}:`, error);
    }
  }
  
  return recipes;
}