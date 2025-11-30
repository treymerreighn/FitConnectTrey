/**
 * Ingredient Database for Nutrition Tracking
 * 
 * This database contains common food ingredients with their nutritional information
 * per 100 grams. Similar to MyFitnessPal, users can search for ingredients, specify
 * quantities, and automatically calculate total nutrition.
 * 
 * Nutritional values are based on USDA FoodData Central and other reliable sources.
 */

export interface IngredientData {
  name: string;
  category: string;
  calories: number;  // per 100g
  protein: number;   // grams per 100g
  carbs: number;     // grams per 100g
  fat: number;       // grams per 100g
  fiber: number;     // grams per 100g
}

export const INGREDIENT_DATABASE: IngredientData[] = [
  // ===== PROTEINS - MEATS =====
  // Poultry
  { name: "Chicken Breast", category: "Protein", calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
  { name: "Chicken Thigh", category: "Protein", calories: 209, protein: 26, carbs: 0, fat: 11, fiber: 0 },
  { name: "Chicken Wings", category: "Protein", calories: 203, protein: 30, carbs: 0, fat: 8, fiber: 0 },
  { name: "Ground Chicken", category: "Protein", calories: 143, protein: 17, carbs: 0, fat: 8, fiber: 0 },
  { name: "Turkey Breast", category: "Protein", calories: 135, protein: 30, carbs: 0, fat: 0.7, fiber: 0 },
  { name: "Ground Turkey", category: "Protein", calories: 149, protein: 20, carbs: 0, fat: 7, fiber: 0 },
  { name: "Duck", category: "Protein", calories: 337, protein: 19, carbs: 0, fat: 28, fiber: 0 },
  
  // Beef
  { name: "Ground Beef (90% lean)", category: "Protein", calories: 176, protein: 20, carbs: 0, fat: 10, fiber: 0 },
  { name: "Ground Beef (80% lean)", category: "Protein", calories: 254, protein: 17, carbs: 0, fat: 20, fiber: 0 },
  { name: "Sirloin Steak", category: "Protein", calories: 271, protein: 27, carbs: 0, fat: 18, fiber: 0 },
  { name: "Ribeye Steak", category: "Protein", calories: 291, protein: 25, carbs: 0, fat: 21, fiber: 0 },
  { name: "Filet Mignon", category: "Protein", calories: 227, protein: 27, carbs: 0, fat: 13, fiber: 0 },
  { name: "Beef Brisket", category: "Protein", calories: 288, protein: 26, carbs: 0, fat: 20, fiber: 0 },
  { name: "Flank Steak", category: "Protein", calories: 192, protein: 27, carbs: 0, fat: 9, fiber: 0 },
  
  // Pork
  { name: "Pork Chop", category: "Protein", calories: 231, protein: 26, carbs: 0, fat: 14, fiber: 0 },
  { name: "Pork Tenderloin", category: "Protein", calories: 143, protein: 26, carbs: 0, fat: 4, fiber: 0 },
  { name: "Ground Pork", category: "Protein", calories: 263, protein: 16, carbs: 0, fat: 21, fiber: 0 },
  { name: "Bacon", category: "Protein", calories: 541, protein: 37, carbs: 1.4, fat: 42, fiber: 0 },
  { name: "Ham", category: "Protein", calories: 145, protein: 21, carbs: 1.5, fat: 6, fiber: 0 },
  { name: "Sausage", category: "Protein", calories: 346, protein: 13, carbs: 1.2, fat: 32, fiber: 0 },
  
  // Lamb
  { name: "Lamb Chop", category: "Protein", calories: 294, protein: 25, carbs: 0, fat: 21, fiber: 0 },
  { name: "Ground Lamb", category: "Protein", calories: 283, protein: 17, carbs: 0, fat: 23, fiber: 0 },
  
  // ===== PROTEINS - SEAFOOD =====
  { name: "Salmon", category: "Protein", calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0 },
  { name: "Tuna (fresh)", category: "Protein", calories: 144, protein: 23, carbs: 0, fat: 5, fiber: 0 },
  { name: "Tuna (canned in water)", category: "Protein", calories: 116, protein: 26, carbs: 0, fat: 0.8, fiber: 0 },
  { name: "Shrimp", category: "Protein", calories: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: 0 },
  { name: "Cod", category: "Protein", calories: 82, protein: 18, carbs: 0, fat: 0.7, fiber: 0 },
  { name: "Tilapia", category: "Protein", calories: 96, protein: 20, carbs: 0, fat: 1.7, fiber: 0 },
  { name: "Halibut", category: "Protein", calories: 111, protein: 23, carbs: 0, fat: 1.6, fiber: 0 },
  { name: "Mahi Mahi", category: "Protein", calories: 85, protein: 18, carbs: 0, fat: 0.7, fiber: 0 },
  { name: "Swordfish", category: "Protein", calories: 144, protein: 20, carbs: 0, fat: 6.7, fiber: 0 },
  { name: "Trout", category: "Protein", calories: 148, protein: 21, carbs: 0, fat: 7, fiber: 0 },
  { name: "Sardines", category: "Protein", calories: 208, protein: 25, carbs: 0, fat: 11, fiber: 0 },
  { name: "Mackerel", category: "Protein", calories: 262, protein: 19, carbs: 0, fat: 18, fiber: 0 },
  { name: "Crab", category: "Protein", calories: 97, protein: 19, carbs: 0, fat: 1.5, fiber: 0 },
  { name: "Lobster", category: "Protein", calories: 89, protein: 19, carbs: 0, fat: 0.9, fiber: 0 },
  { name: "Scallops", category: "Protein", calories: 69, protein: 12, carbs: 3.2, fat: 0.5, fiber: 0 },
  { name: "Clams", category: "Protein", calories: 86, protein: 15, carbs: 3, fat: 1, fiber: 0 },
  { name: "Oysters", category: "Protein", calories: 68, protein: 7, carbs: 3.9, fat: 2.5, fiber: 0 },
  { name: "Octopus", category: "Protein", calories: 82, protein: 15, carbs: 2.2, fat: 1, fiber: 0 },
  { name: "Squid (Calamari)", category: "Protein", calories: 92, protein: 16, carbs: 3.1, fat: 1.4, fiber: 0 },
  
  // ===== PROTEINS - EGGS & DAIRY PROTEINS =====
  { name: "Eggs (whole)", category: "Protein", calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0 },
  { name: "Egg Whites", category: "Protein", calories: 52, protein: 11, carbs: 0.7, fat: 0.2, fiber: 0 },
  { name: "Egg Yolks", category: "Protein", calories: 322, protein: 16, carbs: 3.6, fat: 27, fiber: 0 },
  { name: "Greek Yogurt (nonfat)", category: "Protein", calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0 },
  { name: "Greek Yogurt (full fat)", category: "Protein", calories: 97, protein: 9, carbs: 3.9, fat: 5, fiber: 0 },
  { name: "Cottage Cheese (low-fat)", category: "Protein", calories: 98, protein: 11, carbs: 3.4, fat: 4.3, fiber: 0 },
  { name: "Cottage Cheese (full-fat)", category: "Protein", calories: 98, protein: 11, carbs: 3.4, fat: 4.3, fiber: 0 },
  { name: "Ricotta Cheese", category: "Protein", calories: 174, protein: 11, carbs: 3, fat: 13, fiber: 0 },
  
  // ===== PROTEINS - PLANT-BASED =====
  { name: "Tofu (firm)", category: "Protein", calories: 144, protein: 17, carbs: 3, fat: 9, fiber: 2 },
  { name: "Tofu (silken)", category: "Protein", calories: 55, protein: 5, carbs: 2, fat: 3, fiber: 0.2 },
  { name: "Tempeh", category: "Protein", calories: 193, protein: 19, carbs: 9, fat: 11, fiber: 9 },
  { name: "Seitan", category: "Protein", calories: 370, protein: 75, carbs: 14, fat: 1.9, fiber: 0.6 },
  { name: "Edamame", category: "Protein", calories: 122, protein: 11, carbs: 10, fat: 5, fiber: 5 },
  { name: "Protein Powder (whey)", category: "Protein", calories: 400, protein: 80, carbs: 10, fat: 5, fiber: 2 },
  { name: "Protein Powder (plant)", category: "Protein", calories: 380, protein: 70, carbs: 15, fat: 7, fiber: 8 },
  
  // ===== CARBOHYDRATES - GRAINS =====
  { name: "Brown Rice (cooked)", category: "Carbs", calories: 112, protein: 2.6, carbs: 24, fat: 0.9, fiber: 1.8 },
  { name: "White Rice (cooked)", category: "Carbs", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 },
  { name: "Jasmine Rice (cooked)", category: "Carbs", calories: 129, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 },
  { name: "Basmati Rice (cooked)", category: "Carbs", calories: 121, protein: 2.6, carbs: 26, fat: 0.4, fiber: 0.7 },
  { name: "Wild Rice (cooked)", category: "Carbs", calories: 101, protein: 4, carbs: 21, fat: 0.3, fiber: 1.8 },
  { name: "Quinoa (cooked)", category: "Carbs", calories: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8 },
  { name: "Couscous (cooked)", category: "Carbs", calories: 112, protein: 3.8, carbs: 23, fat: 0.2, fiber: 1.4 },
  { name: "Bulgur (cooked)", category: "Carbs", calories: 83, protein: 3.1, carbs: 19, fat: 0.2, fiber: 4.5 },
  { name: "Farro (cooked)", category: "Carbs", calories: 114, protein: 4.1, carbs: 24, fat: 0.8, fiber: 2.5 },
  { name: "Barley (cooked)", category: "Carbs", calories: 123, protein: 2.3, carbs: 28, fat: 0.4, fiber: 3.8 },
  { name: "Millet (cooked)", category: "Carbs", calories: 119, protein: 3.5, carbs: 24, fat: 1, fiber: 1.3 },
  
  // ===== CARBOHYDRATES - OATS & CEREALS =====
  { name: "Oats (dry)", category: "Carbs", calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 11 },
  { name: "Steel Cut Oats (dry)", category: "Carbs", calories: 379, protein: 15, carbs: 68, fat: 6.9, fiber: 10 },
  { name: "Instant Oats (dry)", category: "Carbs", calories: 379, protein: 13, carbs: 68, fat: 6.5, fiber: 9 },
  { name: "Granola", category: "Carbs", calories: 471, protein: 14, carbs: 64, fat: 20, fiber: 10 },
  { name: "Corn Flakes", category: "Carbs", calories: 357, protein: 7.5, carbs: 84, fat: 0.4, fiber: 3 },
  { name: "Bran Flakes", category: "Carbs", calories: 305, protein: 10, carbs: 72, fat: 1.9, fiber: 18 },
  
  // ===== CARBOHYDRATES - BREAD & WRAPS =====
  { name: "Whole Wheat Bread", category: "Carbs", calories: 247, protein: 13, carbs: 41, fat: 3.4, fiber: 7 },
  { name: "White Bread", category: "Carbs", calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7 },
  { name: "Sourdough Bread", category: "Carbs", calories: 289, protein: 12, carbs: 56, fat: 2.1, fiber: 2.9 },
  { name: "Rye Bread", category: "Carbs", calories: 259, protein: 8.5, carbs: 48, fat: 3.3, fiber: 5.8 },
  { name: "Pita Bread", category: "Carbs", calories: 275, protein: 9, carbs: 55, fat: 1.2, fiber: 2.2 },
  { name: "Naan Bread", category: "Carbs", calories: 262, protein: 8.7, carbs: 45, fat: 5.4, fiber: 2 },
  { name: "Bagel", category: "Carbs", calories: 257, protein: 10, carbs: 50, fat: 1.7, fiber: 2.1 },
  { name: "English Muffin", category: "Carbs", calories: 235, protein: 8, carbs: 46, fat: 2, fiber: 2.6 },
  { name: "Tortilla (flour)", category: "Carbs", calories: 304, protein: 8.2, carbs: 50, fat: 7.7, fiber: 3 },
  { name: "Tortilla (corn)", category: "Carbs", calories: 218, protein: 5.7, carbs: 45, fat: 2.8, fiber: 6.3 },
  
  // ===== CARBOHYDRATES - PASTA & NOODLES =====
  { name: "Pasta (cooked)", category: "Carbs", calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8 },
  { name: "Whole Wheat Pasta (cooked)", category: "Carbs", calories: 124, protein: 5.3, carbs: 26, fat: 0.5, fiber: 3.9 },
  { name: "Spaghetti (cooked)", category: "Carbs", calories: 158, protein: 5.8, carbs: 31, fat: 0.9, fiber: 1.8 },
  { name: "Penne (cooked)", category: "Carbs", calories: 157, protein: 5.8, carbs: 31, fat: 0.9, fiber: 1.8 },
  { name: "Macaroni (cooked)", category: "Carbs", calories: 158, protein: 5.3, carbs: 31, fat: 0.9, fiber: 1.8 },
  { name: "Egg Noodles (cooked)", category: "Carbs", calories: 138, protein: 4.5, carbs: 25, fat: 2.1, fiber: 1.2 },
  { name: "Ramen Noodles (cooked)", category: "Carbs", calories: 138, protein: 4.5, carbs: 25, fat: 2, fiber: 1.5 },
  { name: "Rice Noodles (cooked)", category: "Carbs", calories: 109, protein: 1.8, carbs: 24, fat: 0.2, fiber: 1 },
  { name: "Soba Noodles (cooked)", category: "Carbs", calories: 99, protein: 5.1, carbs: 21, fat: 0.1, fiber: 2 },
  { name: "Udon Noodles (cooked)", category: "Carbs", calories: 99, protein: 2.6, carbs: 21, fat: 0.5, fiber: 0 },
  
  // ===== CARBOHYDRATES - POTATOES & TUBERS =====
  { name: "Sweet Potato", category: "Carbs", calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3 },
  { name: "White Potato", category: "Carbs", calories: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.1 },
  { name: "Red Potato", category: "Carbs", calories: 70, protein: 1.9, carbs: 16, fat: 0.1, fiber: 1.8 },
  { name: "Russet Potato", category: "Carbs", calories: 79, protein: 2.1, carbs: 18, fat: 0.1, fiber: 1.4 },
  { name: "Yam", category: "Carbs", calories: 118, protein: 1.5, carbs: 28, fat: 0.2, fiber: 4.1 },
  { name: "Cassava", category: "Carbs", calories: 160, protein: 1.4, carbs: 38, fat: 0.3, fiber: 1.8 },
  { name: "Taro", category: "Carbs", calories: 112, protein: 1.5, carbs: 27, fat: 0.2, fiber: 4.1 },
  
  // ===== VEGETABLES - LEAFY GREENS =====
  { name: "Spinach", category: "Vegetables", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2 },
  { name: "Kale", category: "Vegetables", calories: 35, protein: 2.9, carbs: 4.4, fat: 1.5, fiber: 4.1 },
  { name: "Arugula", category: "Vegetables", calories: 25, protein: 2.6, carbs: 3.7, fat: 0.7, fiber: 1.6 },
  { name: "Lettuce (romaine)", category: "Vegetables", calories: 17, protein: 1.2, carbs: 3.3, fat: 0.3, fiber: 2.1 },
  { name: "Lettuce (iceberg)", category: "Vegetables", calories: 14, protein: 0.9, carbs: 3, fat: 0.1, fiber: 1.2 },
  { name: "Swiss Chard", category: "Vegetables", calories: 19, protein: 1.8, carbs: 3.7, fat: 0.2, fiber: 1.6 },
  { name: "Collard Greens", category: "Vegetables", calories: 32, protein: 3, carbs: 5.4, fat: 0.6, fiber: 4 },
  { name: "Mustard Greens", category: "Vegetables", calories: 27, protein: 2.7, carbs: 4.7, fat: 0.4, fiber: 3.2 },
  { name: "Watercress", category: "Vegetables", calories: 11, protein: 2.3, carbs: 1.3, fat: 0.1, fiber: 0.5 },
  
  // ===== VEGETABLES - CRUCIFEROUS =====
  { name: "Broccoli", category: "Vegetables", calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6 },
  { name: "Cauliflower", category: "Vegetables", calories: 25, protein: 1.9, carbs: 5, fat: 0.3, fiber: 2 },
  { name: "Brussels Sprouts", category: "Vegetables", calories: 43, protein: 3.4, carbs: 9, fat: 0.3, fiber: 3.8 },
  { name: "Cabbage", category: "Vegetables", calories: 25, protein: 1.3, carbs: 5.8, fat: 0.1, fiber: 2.5 },
  { name: "Bok Choy", category: "Vegetables", calories: 13, protein: 1.5, carbs: 2.2, fat: 0.2, fiber: 1 },
  { name: "Kohlrabi", category: "Vegetables", calories: 27, protein: 1.7, carbs: 6.2, fat: 0.1, fiber: 3.6 },
  
  // ===== VEGETABLES - ROOT VEGETABLES =====
  { name: "Carrots", category: "Vegetables", calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8 },
  { name: "Beets", category: "Vegetables", calories: 43, protein: 1.6, carbs: 10, fat: 0.2, fiber: 2.8 },
  { name: "Turnips", category: "Vegetables", calories: 28, protein: 0.9, carbs: 6.4, fat: 0.1, fiber: 1.8 },
  { name: "Radishes", category: "Vegetables", calories: 16, protein: 0.7, carbs: 3.4, fat: 0.1, fiber: 1.6 },
  { name: "Parsnips", category: "Vegetables", calories: 75, protein: 1.2, carbs: 18, fat: 0.3, fiber: 4.9 },
  { name: "Rutabaga", category: "Vegetables", calories: 37, protein: 1.1, carbs: 8.6, fat: 0.2, fiber: 2.3 },
  
  // ===== VEGETABLES - SQUASH & GOURDS =====
  { name: "Zucchini", category: "Vegetables", calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1 },
  { name: "Yellow Squash", category: "Vegetables", calories: 16, protein: 1.2, carbs: 3.4, fat: 0.2, fiber: 1.1 },
  { name: "Butternut Squash", category: "Vegetables", calories: 45, protein: 1, carbs: 12, fat: 0.1, fiber: 2 },
  { name: "Acorn Squash", category: "Vegetables", calories: 40, protein: 0.8, carbs: 10, fat: 0.1, fiber: 1.5 },
  { name: "Spaghetti Squash", category: "Vegetables", calories: 31, protein: 0.6, carbs: 7, fat: 0.6, fiber: 1.5 },
  { name: "Pumpkin", category: "Vegetables", calories: 26, protein: 1, carbs: 6.5, fat: 0.1, fiber: 0.5 },
  { name: "Cucumber", category: "Vegetables", calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5 },
  
  // ===== VEGETABLES - PEPPERS & NIGHTSHADES =====
  { name: "Bell Peppers (red)", category: "Vegetables", calories: 31, protein: 1, carbs: 6, fat: 0.3, fiber: 2.1 },
  { name: "Bell Peppers (green)", category: "Vegetables", calories: 20, protein: 0.9, carbs: 4.6, fat: 0.2, fiber: 1.7 },
  { name: "Jalapeño Peppers", category: "Vegetables", calories: 29, protein: 0.9, carbs: 6.5, fat: 0.4, fiber: 2.8 },
  { name: "Serrano Peppers", category: "Vegetables", calories: 32, protein: 1.7, carbs: 7, fat: 0.4, fiber: 3.7 },
  { name: "Poblano Peppers", category: "Vegetables", calories: 20, protein: 1, carbs: 4, fat: 0.2, fiber: 2 },
  { name: "Tomato", category: "Vegetables", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 },
  { name: "Cherry Tomatoes", category: "Vegetables", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 },
  { name: "Eggplant", category: "Vegetables", calories: 25, protein: 1, carbs: 5.9, fat: 0.2, fiber: 3 },
  
  // ===== VEGETABLES - ALLIUMS =====
  { name: "Onion", category: "Vegetables", calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7 },
  { name: "Red Onion", category: "Vegetables", calories: 42, protein: 0.9, carbs: 10, fat: 0.1, fiber: 1.4 },
  { name: "Shallots", category: "Vegetables", calories: 72, protein: 2.5, carbs: 17, fat: 0.1, fiber: 3.2 },
  { name: "Garlic", category: "Vegetables", calories: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1 },
  { name: "Leeks", category: "Vegetables", calories: 61, protein: 1.5, carbs: 14, fat: 0.3, fiber: 1.8 },
  { name: "Scallions (green onions)", category: "Vegetables", calories: 32, protein: 1.8, carbs: 7.3, fat: 0.2, fiber: 2.6 },
  
  // ===== VEGETABLES - OTHER =====
  { name: "Asparagus", category: "Vegetables", calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1, fiber: 2.1 },
  { name: "Green Beans", category: "Vegetables", calories: 31, protein: 1.8, carbs: 7, fat: 0.2, fiber: 2.7 },
  { name: "Celery", category: "Vegetables", calories: 16, protein: 0.7, carbs: 3, fat: 0.2, fiber: 1.6 },
  { name: "Mushrooms (white)", category: "Vegetables", calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1 },
  { name: "Mushrooms (portobello)", category: "Vegetables", calories: 22, protein: 2.1, carbs: 3.9, fat: 0.4, fiber: 1.3 },
  { name: "Mushrooms (shiitake)", category: "Vegetables", calories: 34, protein: 2.2, carbs: 6.8, fat: 0.5, fiber: 2.5 },
  { name: "Corn", category: "Vegetables", calories: 86, protein: 3.3, carbs: 19, fat: 1.4, fiber: 2 },
  { name: "Peas (green)", category: "Vegetables", calories: 81, protein: 5.4, carbs: 14, fat: 0.4, fiber: 5.7 },
  { name: "Snow Peas", category: "Vegetables", calories: 42, protein: 2.8, carbs: 7.6, fat: 0.2, fiber: 2.6 },
  { name: "Okra", category: "Vegetables", calories: 33, protein: 1.9, carbs: 7.5, fat: 0.2, fiber: 3.2 },
  { name: "Artichoke", category: "Vegetables", calories: 47, protein: 3.3, carbs: 11, fat: 0.2, fiber: 5.4 },
  { name: "Fennel", category: "Vegetables", calories: 31, protein: 1.2, carbs: 7.3, fat: 0.2, fiber: 3.1 },
  
  // ===== LEGUMES & BEANS =====
  { name: "Black Beans (cooked)", category: "Legumes", calories: 132, protein: 8.9, carbs: 24, fat: 0.5, fiber: 8.7 },
  { name: "Kidney Beans (cooked)", category: "Legumes", calories: 127, protein: 8.7, carbs: 23, fat: 0.5, fiber: 6.4 },
  { name: "Pinto Beans (cooked)", category: "Legumes", calories: 143, protein: 9, carbs: 26, fat: 0.7, fiber: 9 },
  { name: "Navy Beans (cooked)", category: "Legumes", calories: 140, protein: 8.2, carbs: 26, fat: 0.6, fiber: 10 },
  { name: "Chickpeas (cooked)", category: "Legumes", calories: 164, protein: 8.9, carbs: 27, fat: 2.6, fiber: 7.6 },
  { name: "Lentils (cooked)", category: "Legumes", calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9 },
  { name: "Red Lentils (cooked)", category: "Legumes", calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9 },
  { name: "Green Lentils (cooked)", category: "Legumes", calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9 },
  { name: "Lima Beans (cooked)", category: "Legumes", calories: 115, protein: 7.8, carbs: 21, fat: 0.4, fiber: 7 },
  { name: "Soybeans (cooked)", category: "Legumes", calories: 173, protein: 17, carbs: 10, fat: 9, fiber: 6 },
  { name: "Split Peas (cooked)", category: "Legumes", calories: 118, protein: 8.3, carbs: 21, fat: 0.4, fiber: 8.3 },
  
  // ===== NUTS =====
  { name: "Almonds", category: "Fats", calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12.5 },
  { name: "Walnuts", category: "Fats", calories: 654, protein: 15, carbs: 14, fat: 65, fiber: 6.7 },
  { name: "Cashews", category: "Fats", calories: 553, protein: 18, carbs: 30, fat: 44, fiber: 3.3 },
  { name: "Pecans", category: "Fats", calories: 691, protein: 9, carbs: 14, fat: 72, fiber: 9.6 },
  { name: "Brazil Nuts", category: "Fats", calories: 656, protein: 14, carbs: 12, fat: 66, fiber: 7.5 },
  { name: "Macadamia Nuts", category: "Fats", calories: 718, protein: 7.9, carbs: 14, fat: 76, fiber: 8.6 },
  { name: "Pistachios", category: "Fats", calories: 562, protein: 20, carbs: 28, fat: 45, fiber: 10 },
  { name: "Hazelnuts", category: "Fats", calories: 628, protein: 15, carbs: 17, fat: 61, fiber: 9.7 },
  { name: "Pine Nuts", category: "Fats", calories: 673, protein: 14, carbs: 13, fat: 68, fiber: 3.7 },
  { name: "Peanuts", category: "Fats", calories: 567, protein: 26, carbs: 16, fat: 49, fiber: 8.5 },
  
  // ===== SEEDS =====
  { name: "Chia Seeds", category: "Fats", calories: 486, protein: 17, carbs: 42, fat: 31, fiber: 34 },
  { name: "Flaxseed", category: "Fats", calories: 534, protein: 18, carbs: 29, fat: 42, fiber: 27 },
  { name: "Pumpkin Seeds", category: "Fats", calories: 559, protein: 30, carbs: 14, fat: 49, fiber: 6 },
  { name: "Sunflower Seeds", category: "Fats", calories: 584, protein: 21, carbs: 20, fat: 51, fiber: 8.6 },
  { name: "Sesame Seeds", category: "Fats", calories: 573, protein: 18, carbs: 23, fat: 50, fiber: 12 },
  { name: "Hemp Seeds", category: "Fats", calories: 553, protein: 32, carbs: 8.7, fat: 49, fiber: 4 },
  
  // ===== NUT BUTTERS =====
  { name: "Peanut Butter", category: "Fats", calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6 },
  { name: "Almond Butter", category: "Fats", calories: 614, protein: 21, carbs: 19, fat: 56, fiber: 10 },
  { name: "Cashew Butter", category: "Fats", calories: 587, protein: 18, carbs: 27, fat: 49, fiber: 2 },
  { name: "Sunflower Seed Butter", category: "Fats", calories: 617, protein: 20, carbs: 18, fat: 55, fiber: 8 },
  { name: "Tahini", category: "Fats", calories: 595, protein: 17, carbs: 21, fat: 54, fiber: 9.3 },
  
  // ===== OILS & FATS =====
  { name: "Olive Oil", category: "Fats", calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  { name: "Coconut Oil", category: "Fats", calories: 862, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  { name: "Avocado Oil", category: "Fats", calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  { name: "Vegetable Oil", category: "Fats", calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  { name: "Canola Oil", category: "Fats", calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  { name: "Sesame Oil", category: "Fats", calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  { name: "Butter", category: "Fats", calories: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0 },
  { name: "Ghee", category: "Fats", calories: 900, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  { name: "Avocado", category: "Fats", calories: 160, protein: 2, carbs: 8.5, fat: 15, fiber: 6.7 },
  
  // ===== DAIRY =====
  { name: "Whole Milk", category: "Dairy", calories: 61, protein: 3.2, carbs: 5, fat: 3.3, fiber: 0 },
  { name: "2% Milk", category: "Dairy", calories: 50, protein: 3.3, carbs: 4.8, fat: 2, fiber: 0 },
  { name: "1% Milk", category: "Dairy", calories: 42, protein: 3.4, carbs: 5, fat: 1, fiber: 0 },
  { name: "Skim Milk", category: "Dairy", calories: 34, protein: 3.4, carbs: 5, fat: 0.1, fiber: 0 },
  { name: "Almond Milk (unsweetened)", category: "Dairy", calories: 17, protein: 0.6, carbs: 0.6, fat: 1.2, fiber: 0.5 },
  { name: "Oat Milk", category: "Dairy", calories: 47, protein: 1, carbs: 7.6, fat: 1.5, fiber: 0.8 },
  { name: "Soy Milk", category: "Dairy", calories: 54, protein: 3.3, carbs: 6, fat: 1.8, fiber: 0.6 },
  { name: "Coconut Milk", category: "Dairy", calories: 230, protein: 2.3, carbs: 6, fat: 24, fiber: 2.2 },
  { name: "Heavy Cream", category: "Dairy", calories: 340, protein: 2.1, carbs: 2.8, fat: 36, fiber: 0 },
  { name: "Half and Half", category: "Dairy", calories: 131, protein: 3.1, carbs: 4.3, fat: 12, fiber: 0 },
  { name: "Sour Cream", category: "Dairy", calories: 193, protein: 2.4, carbs: 4.6, fat: 19, fiber: 0 },
  { name: "Cream Cheese", category: "Dairy", calories: 342, protein: 6, carbs: 5.5, fat: 34, fiber: 0 },
  { name: "Cheddar Cheese", category: "Dairy", calories: 403, protein: 25, carbs: 1.3, fat: 33, fiber: 0 },
  { name: "Mozzarella", category: "Dairy", calories: 280, protein: 28, carbs: 2.2, fat: 17, fiber: 0 },
  { name: "Parmesan", category: "Dairy", calories: 431, protein: 38, carbs: 4.1, fat: 29, fiber: 0 },
  { name: "Swiss Cheese", category: "Dairy", calories: 380, protein: 27, carbs: 5.4, fat: 28, fiber: 0 },
  { name: "Feta Cheese", category: "Dairy", calories: 264, protein: 14, carbs: 4.1, fat: 21, fiber: 0 },
  { name: "Blue Cheese", category: "Dairy", calories: 353, protein: 21, carbs: 2.3, fat: 29, fiber: 0 },
  { name: "Goat Cheese", category: "Dairy", calories: 364, protein: 22, carbs: 2.2, fat: 30, fiber: 0 },
  { name: "Brie", category: "Dairy", calories: 334, protein: 21, carbs: 0.5, fat: 28, fiber: 0 },
  { name: "Provolone", category: "Dairy", calories: 351, protein: 26, carbs: 2.1, fat: 27, fiber: 0 },
  
  // ===== FRUITS - BERRIES =====
  { name: "Strawberries", category: "Fruits", calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2 },
  { name: "Blueberries", category: "Fruits", calories: 57, protein: 0.7, carbs: 14, fat: 0.3, fiber: 2.4 },
  { name: "Raspberries", category: "Fruits", calories: 52, protein: 1.2, carbs: 12, fat: 0.7, fiber: 6.5 },
  { name: "Blackberries", category: "Fruits", calories: 43, protein: 1.4, carbs: 10, fat: 0.5, fiber: 5.3 },
  { name: "Cranberries", category: "Fruits", calories: 46, protein: 0.4, carbs: 12, fat: 0.1, fiber: 4.6 },
  
  // ===== FRUITS - CITRUS =====
  { name: "Orange", category: "Fruits", calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4 },
  { name: "Grapefruit", category: "Fruits", calories: 42, protein: 0.8, carbs: 11, fat: 0.1, fiber: 1.6 },
  { name: "Lemon", category: "Fruits", calories: 29, protein: 1.1, carbs: 9.3, fat: 0.3, fiber: 2.8 },
  { name: "Lime", category: "Fruits", calories: 30, protein: 0.7, carbs: 11, fat: 0.2, fiber: 2.8 },
  { name: "Tangerine", category: "Fruits", calories: 53, protein: 0.8, carbs: 13, fat: 0.3, fiber: 1.8 },
  { name: "Clementine", category: "Fruits", calories: 47, protein: 0.9, carbs: 12, fat: 0.2, fiber: 1.7 },
  
  // ===== FRUITS - TROPICAL =====
  { name: "Banana", category: "Fruits", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6 },
  { name: "Mango", category: "Fruits", calories: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6 },
  { name: "Pineapple", category: "Fruits", calories: 50, protein: 0.5, carbs: 13, fat: 0.1, fiber: 1.4 },
  { name: "Papaya", category: "Fruits", calories: 43, protein: 0.5, carbs: 11, fat: 0.3, fiber: 1.7 },
  { name: "Kiwi", category: "Fruits", calories: 61, protein: 1.1, carbs: 15, fat: 0.5, fiber: 3 },
  { name: "Dragon Fruit", category: "Fruits", calories: 60, protein: 1.2, carbs: 13, fat: 0.4, fiber: 3 },
  { name: "Passion Fruit", category: "Fruits", calories: 97, protein: 2.2, carbs: 23, fat: 0.7, fiber: 10 },
  { name: "Guava", category: "Fruits", calories: 68, protein: 2.6, carbs: 14, fat: 1, fiber: 5.4 },
  { name: "Coconut (meat)", category: "Fruits", calories: 354, protein: 3.3, carbs: 15, fat: 33, fiber: 9 },
  
  // ===== FRUITS - STONE FRUITS =====
  { name: "Peach", category: "Fruits", calories: 39, protein: 0.9, carbs: 9.5, fat: 0.3, fiber: 1.5 },
  { name: "Nectarine", category: "Fruits", calories: 44, protein: 1.1, carbs: 11, fat: 0.3, fiber: 1.7 },
  { name: "Plum", category: "Fruits", calories: 46, protein: 0.7, carbs: 11, fat: 0.3, fiber: 1.4 },
  { name: "Apricot", category: "Fruits", calories: 48, protein: 1.4, carbs: 11, fat: 0.4, fiber: 2 },
  { name: "Cherry", category: "Fruits", calories: 50, protein: 1, carbs: 12, fat: 0.3, fiber: 1.6 },
  
  // ===== FRUITS - OTHER =====
  { name: "Apple", category: "Fruits", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4 },
  { name: "Pear", category: "Fruits", calories: 57, protein: 0.4, carbs: 15, fat: 0.1, fiber: 3.1 },
  { name: "Grapes", category: "Fruits", calories: 69, protein: 0.7, carbs: 18, fat: 0.2, fiber: 0.9 },
  { name: "Watermelon", category: "Fruits", calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2, fiber: 0.4 },
  { name: "Cantaloupe", category: "Fruits", calories: 34, protein: 0.8, carbs: 8.2, fat: 0.2, fiber: 0.9 },
  { name: "Honeydew", category: "Fruits", calories: 36, protein: 0.5, carbs: 9.1, fat: 0.1, fiber: 0.8 },
  { name: "Pomegranate", category: "Fruits", calories: 83, protein: 1.7, carbs: 19, fat: 1.2, fiber: 4 },
  { name: "Fig", category: "Fruits", calories: 74, protein: 0.8, carbs: 19, fat: 0.3, fiber: 2.9 },
  { name: "Date", category: "Fruits", calories: 277, protein: 1.8, carbs: 75, fat: 0.2, fiber: 6.7 },
  { name: "Raisins", category: "Fruits", calories: 299, protein: 3.1, carbs: 79, fat: 0.5, fiber: 3.7 },
  
  // ===== CONDIMENTS & SAUCES =====
  { name: "Ketchup", category: "Condiments", calories: 101, protein: 1.2, carbs: 27, fat: 0.1, fiber: 0.3 },
  { name: "Mustard", category: "Condiments", calories: 66, protein: 3.7, carbs: 6.4, fat: 4, fiber: 3.3 },
  { name: "Mayonnaise", category: "Condiments", calories: 680, protein: 0.9, carbs: 0.6, fat: 75, fiber: 0 },
  { name: "Soy Sauce", category: "Condiments", calories: 53, protein: 8.1, carbs: 4.9, fat: 0.1, fiber: 0.8 },
  { name: "BBQ Sauce", category: "Condiments", calories: 172, protein: 0.9, carbs: 41, fat: 0.4, fiber: 1.1 },
  { name: "Hot Sauce", category: "Condiments", calories: 12, protein: 0.5, carbs: 2.7, fat: 0.1, fiber: 0.5 },
  { name: "Sriracha", category: "Condiments", calories: 93, protein: 2, carbs: 20, fat: 0.5, fiber: 1 },
  { name: "Ranch Dressing", category: "Condiments", calories: 458, protein: 2.1, carbs: 9.3, fat: 47, fiber: 0.5 },
  { name: "Balsamic Vinegar", category: "Condiments", calories: 88, protein: 0.5, carbs: 17, fat: 0, fiber: 0 },
  { name: "Apple Cider Vinegar", category: "Condiments", calories: 21, protein: 0, carbs: 0.9, fat: 0, fiber: 0 },
  { name: "Honey", category: "Condiments", calories: 304, protein: 0.3, carbs: 82, fat: 0, fiber: 0.2 },
  { name: "Maple Syrup", category: "Condiments", calories: 260, protein: 0, carbs: 67, fat: 0.2, fiber: 0 },
  { name: "Salsa", category: "Condiments", calories: 36, protein: 1.5, carbs: 8, fat: 0.2, fiber: 1.8 },
  { name: "Hummus", category: "Condiments", calories: 177, protein: 4.9, carbs: 20, fat: 8.6, fiber: 4 },
  { name: "Guacamole", category: "Condiments", calories: 150, protein: 2, carbs: 9, fat: 14, fiber: 6.5 },
];

export function searchIngredients(query: string): IngredientData[] {
  const lowerQuery = query.toLowerCase();
  return INGREDIENT_DATABASE.filter(ingredient =>
    ingredient.name.toLowerCase().includes(lowerQuery) ||
    ingredient.category.toLowerCase().includes(lowerQuery)
  );
}

export function getIngredientByName(name: string): IngredientData | undefined {
  return INGREDIENT_DATABASE.find(
    ingredient => ingredient.name.toLowerCase() === name.toLowerCase()
  );
}
