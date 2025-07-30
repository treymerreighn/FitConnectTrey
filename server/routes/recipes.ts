import { Router } from "express";
import { storage } from "../storage";
import { generateHealthyRecipes, buildRecipeDatabase } from "../ai-recipe-generator";

const router = Router();

// Get all recipes
router.get("/api/recipes", async (req, res) => {
  try {
    const recipes = await storage.getAllRecipes();
    res.json(recipes);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ message: "Failed to fetch recipes" });
  }
});

// Get featured recipes (random selection)
router.get("/api/recipes/featured", async (req, res) => {
  try {
    const recipes = await storage.getRandomRecipes(6);
    res.json(recipes);
  } catch (error) {
    console.error("Error fetching featured recipes:", error);
    res.status(500).json({ message: "Failed to fetch featured recipes" });
  }
});

// Get recipes by category
router.get("/api/recipes/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const recipes = await storage.getRecipesByCategory(category);
    res.json(recipes);
  } catch (error) {
    console.error("Error fetching recipes by category:", error);
    res.status(500).json({ message: "Failed to fetch recipes by category" });
  }
});

// Search recipes
router.get("/api/recipes/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== "string") {
      return res.status(400).json({ message: "Search query is required" });
    }
    
    const recipes = await storage.searchRecipes(q);
    res.json(recipes);
  } catch (error) {
    console.error("Error searching recipes:", error);
    res.status(500).json({ message: "Failed to search recipes" });
  }
});

// Get recipes by dietary tags
router.get("/api/recipes/dietary", async (req, res) => {
  try {
    const { tags } = req.query;
    if (!tags || typeof tags !== "string") {
      return res.status(400).json({ message: "Dietary tags are required" });
    }
    
    const tagArray = tags.split(",").map(tag => tag.trim());
    const recipes = await storage.getRecipesByDietaryTags(tagArray);
    res.json(recipes);
  } catch (error) {
    console.error("Error fetching recipes by dietary tags:", error);
    res.status(500).json({ message: "Failed to fetch recipes by dietary tags" });
  }
});

// Get single recipe
router.get("/api/recipes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await storage.getRecipeById(id);
    
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    
    res.json(recipe);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({ message: "Failed to fetch recipe" });
  }
});

// Generate new recipes with AI (admin endpoint)
router.post("/api/recipes/generate", async (req, res) => {
  try {
    const { category, difficulty = "easy", count = 5, dietaryTags, cuisineType } = req.body;
    
    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }
    
    const recipes = await generateHealthyRecipes({
      category,
      difficulty,
      count,
      dietaryTags,
      cuisineType,
    });
    
    res.json(recipes);
  } catch (error) {
    console.error("Error generating recipes:", error);
    res.status(500).json({ message: "Failed to generate recipes" });
  }
});

// Initialize recipe database (admin endpoint)
router.post("/api/recipes/initialize", async (req, res) => {
  try {
    await buildRecipeDatabase();
    res.json({ message: "Recipe database initialized successfully" });
  } catch (error) {
    console.error("Error initializing recipe database:", error);
    res.status(500).json({ message: "Failed to initialize recipe database" });
  }
});

export { router as recipesRouter };