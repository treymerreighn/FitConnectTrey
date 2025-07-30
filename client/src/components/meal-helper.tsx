import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ChefHat, Sparkles, Clock, Users, Utensils, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Recipe } from "@shared/schema";

export function MealHelper() {
  const [preferences, setPreferences] = useState("");
  const [cuisineType, setCuisineType] = useState("");
  const [servings, setServings] = useState(2);
  const [difficulty, setDifficulty] = useState("easy");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [healthGoals, setHealthGoals] = useState<string[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState("");
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { toast } = useToast();

  const generateRecipeMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await apiRequest("/api/meal-helper/generate", {
        method: "POST",
        body: params,
      });
      return response.json();
    },
    onSuccess: (recipe: Recipe) => {
      setGeneratedRecipe(recipe);
      toast({
        title: "Recipe Generated!",
        description: `Created "${recipe.name}" just for you`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate recipe",
        variant: "destructive",
      });
    },
  });

  const handleQuickGenerate = (mealType: string) => {
    const params = {
      preferences: preferences.trim() || `A healthy ${mealType} recipe`,
      mealType,
      cuisineType: cuisineType || "any",
      servings,
      difficulty,
      dietaryRestrictions,
      healthGoals,
      availableIngredients: availableIngredients ? availableIngredients.split(",").map(i => i.trim()) : [],
    };

    generateRecipeMutation.mutate(params);
  };

  const handleCustomGenerate = () => {
    if (!preferences.trim()) {
      toast({
        title: "Missing Information",
        description: "Please tell us what you're craving or use the quick buttons above",
        variant: "destructive",
      });
      return;
    }

    const params = {
      preferences: preferences.trim(),
      mealType: "lunch", // default
      cuisineType: cuisineType || "any",
      servings,
      difficulty,
      dietaryRestrictions,
      healthGoals,
      availableIngredients: availableIngredients ? availableIngredients.split(",").map(i => i.trim()) : [],
    };

    generateRecipeMutation.mutate(params);
  };

  const dietaryOptions = [
    "vegetarian", "vegan", "gluten-free", "dairy-free", "keto", "paleo",
    "high-protein", "low-carb", "low-calorie"
  ];

  const healthGoalOptions = [
    "weight-loss", "muscle-gain", "energy-boost", "heart-health", 
    "digestive-health", "immune-support"
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <ChefHat className="h-8 w-8 text-orange-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            AI Meal Helper
          </h2>
          <Sparkles className="h-6 w-6 text-yellow-500" />
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Tell us what you're craving and we'll create a personalized healthy recipe just for you
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Utensils className="h-5 w-5" />
            <span>What are you looking for?</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Recipe Generation */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Button
              onClick={() => handleQuickGenerate("breakfast")}
              disabled={generateRecipeMutation.isPending}
              variant="outline"
              className="h-20 flex-col space-y-1"
            >
              <span className="text-2xl">🍳</span>
              <span className="text-sm">Breakfast</span>
            </Button>
            <Button
              onClick={() => handleQuickGenerate("lunch")}
              disabled={generateRecipeMutation.isPending}
              variant="outline"
              className="h-20 flex-col space-y-1"
            >
              <span className="text-2xl">🥗</span>
              <span className="text-sm">Lunch</span>
            </Button>
            <Button
              onClick={() => handleQuickGenerate("dinner")}
              disabled={generateRecipeMutation.isPending}
              variant="outline"
              className="h-20 flex-col space-y-1"
            >
              <span className="text-2xl">🍽️</span>
              <span className="text-sm">Dinner</span>
            </Button>
            <Button
              onClick={() => handleQuickGenerate("snack")}
              disabled={generateRecipeMutation.isPending}
              variant="outline"
              className="h-20 flex-col space-y-1"
            >
              <span className="text-2xl">🍎</span>
              <span className="text-sm">Snack</span>
            </Button>
            <Button
              onClick={() => handleQuickGenerate("dessert")}
              disabled={generateRecipeMutation.isPending}
              variant="outline"
              className="h-20 flex-col space-y-1"
            >
              <span className="text-2xl">🍰</span>
              <span className="text-sm">Dessert</span>
            </Button>
          </div>

          {/* Dietary Preferences */}
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-lg font-medium">Dietary Preferences</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {dietaryOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={option}
                      checked={dietaryRestrictions.includes(option)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setDietaryRestrictions([...dietaryRestrictions, option]);
                        } else {
                          setDietaryRestrictions(dietaryRestrictions.filter(r => r !== option));
                        }
                      }}
                    />
                    <Label htmlFor={option} className="text-sm capitalize font-medium">
                      {option.replace("-", " ")}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-lg font-medium">Health Goals</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {healthGoalOptions.map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={goal}
                      checked={healthGoals.includes(goal)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setHealthGoals([...healthGoals, goal]);
                        } else {
                          setHealthGoals(healthGoals.filter(g => g !== goal));
                        }
                      }}
                    />
                    <Label htmlFor={goal} className="text-sm capitalize font-medium">
                      {goal.replace("-", " ")}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center">
            <span className="text-gray-500 dark:text-gray-400">or</span>
          </div>

          {/* Available Ingredients */}
          <div className="space-y-2">
            <Label htmlFor="ingredients" className="text-lg font-medium">What ingredients do you have? (optional)</Label>
            <Input
              id="ingredients"
              placeholder="chicken, rice, broccoli, cheese, garlic..."
              value={availableIngredients}
              onChange={(e) => setAvailableIngredients(e.target.value)}
            />
            <p className="text-xs text-gray-500">Separate with commas</p>
          </div>

          {/* Custom Preferences (Optional) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-medium">Tell us what you want to eat (optional)</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-orange-500 hover:text-orange-600"
              >
                {showAdvanced ? "Simple" : "Advanced"}
              </Button>
            </div>
            
            <Textarea
              placeholder="I want something spicy and filling... / I'm craving comfort food... / I need a post-workout meal..."
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              rows={2}
            />

            {showAdvanced && (
              <div className="space-y-4 border-t pt-4">
                {/* Basic Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Cuisine Type</Label>
                    <Input
                      placeholder="Italian, Asian, Mexican..."
                      value={cuisineType}
                      onChange={(e) => setCuisineType(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="servings">Servings</Label>
                    <Input
                      id="servings"
                      type="number"
                      value={servings}
                      onChange={(e) => setServings(Number(e.target.value))}
                      min={1}
                      max={12}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {preferences.trim() && (
            <Button 
              onClick={handleCustomGenerate}
              disabled={generateRecipeMutation.isPending}
              className="w-full bg-orange-500 hover:bg-orange-600"
              size="lg"
            >
              {generateRecipeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Your Recipe...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Custom Recipe
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Generated Recipe */}
      {generatedRecipe && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-700 dark:text-orange-300">
              <ChefHat className="h-5 w-5" />
              <span>{generatedRecipe.name}</span>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                AI Generated
              </Badge>
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">{generatedRecipe.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipe Info */}
            <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{generatedRecipe.prepTime + generatedRecipe.cookTime} min</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{generatedRecipe.servings} servings</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="h-4 w-4" />
                <span>{generatedRecipe.calories} cal</span>
              </div>
            </div>

            {/* Dietary Tags */}
            {generatedRecipe.dietaryTags && generatedRecipe.dietaryTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {generatedRecipe.dietaryTags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Nutrition */}
            <div className="grid grid-cols-4 gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <div className="font-semibold text-lg">{generatedRecipe.protein}g</div>
                <div className="text-xs text-gray-500">Protein</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg">{generatedRecipe.carbs}g</div>
                <div className="text-xs text-gray-500">Carbs</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg">{generatedRecipe.fat}g</div>
                <div className="text-xs text-gray-500">Fat</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg">{generatedRecipe.fiber}g</div>
                <div className="text-xs text-gray-500">Fiber</div>
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <h4 className="font-semibold mb-2">Ingredients:</h4>
              <ul className="space-y-1">
                {generatedRecipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <span className="w-1 h-1 bg-orange-500 rounded-full"></span>
                    <span className="text-sm">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div>
              <h4 className="font-semibold mb-2">Instructions:</h4>
              <ol className="space-y-2">
                {generatedRecipe.instructions.map((instruction, index) => (
                  <li key={index} className="flex space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </span>
                    <span className="text-sm">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Health Benefits */}
            {generatedRecipe.healthBenefits && generatedRecipe.healthBenefits.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center space-x-1">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span>Health Benefits:</span>
                </h4>
                <ul className="space-y-1">
                  {generatedRecipe.healthBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                      <span className="text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tips */}
            {generatedRecipe.tips && generatedRecipe.tips.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Chef's Tips:</h4>
                <ul className="space-y-1">
                  {generatedRecipe.tips.map((tip, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}