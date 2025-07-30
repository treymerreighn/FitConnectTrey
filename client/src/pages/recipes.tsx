import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Clock, Users, ChefHat, Filter, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Recipe } from "@shared/schema";

export default function RecipesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedCuisine, setSelectedCuisine] = useState<string>("all");

  const { data: allRecipes = [], isLoading } = useQuery({
    queryKey: ["/api/recipes"],
  });

  const { data: featuredRecipes = [] } = useQuery({
    queryKey: ["/api/recipes/featured"],
  });

  const { data: userMealPosts = [] } = useQuery({
    queryKey: ["/api/posts", { type: "nutrition" }],
  });

  // Filter recipes based on search and filters
  const filteredRecipes = allRecipes.filter((recipe: Recipe) => {
    const matchesSearch = searchTerm === "" || 
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.ingredients.some(ingredient => 
        ingredient.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesCategory = selectedCategory === "all" || recipe.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "all" || recipe.difficulty === selectedDifficulty;
    const matchesCuisine = selectedCuisine === "all" || recipe.cuisineType === selectedCuisine;

    return matchesSearch && matchesCategory && matchesDifficulty && matchesCuisine;
  });

  const categories = ["all", "breakfast", "lunch", "dinner", "snack", "dessert"];
  const difficulties = ["all", "easy", "medium", "hard"];
  const cuisines = ["all", "italian", "asian", "mexican", "american", "mediterranean", "indian"];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Healthy Recipes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover AI-generated healthy recipes and meals shared by our community
          </p>
        </div>

        <Tabs defaultValue="ai-recipes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai-recipes">
              <ChefHat className="h-4 w-4 mr-2" />
              AI Recipe Database
            </TabsTrigger>
            <TabsTrigger value="user-meals">
              <Users className="h-4 w-4 mr-2" />
              Community Meals (Free)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai-recipes" className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search recipes, ingredients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map(difficulty => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {difficulty === "all" ? "All Levels" : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cuisine" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuisines.map(cuisine => (
                      <SelectItem key={cuisine} value={cuisine}>
                        {cuisine === "all" ? "All Cuisines" : cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Featured Recipes */}
            {featuredRecipes.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-500" />
                  Featured Recipes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredRecipes.slice(0, 6).map((recipe: Recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} featured />
                  ))}
                </div>
              </div>
            )}

            {/* All Recipes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  All Recipes ({filteredRecipes.length})
                </h2>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
              
              {filteredRecipes.length === 0 ? (
                <div className="text-center py-12">
                  <ChefHat className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No recipes found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your search terms or filters
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRecipes.map((recipe: Recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="user-meals" className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Community Meal Sharing
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Free meals and recipes shared by our FitConnect community
              </p>
            </div>

            {userMealPosts.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No community meals yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Be the first to share a healthy meal with the community!
                </p>
                <Button>Share Your Meal</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userMealPosts.map((post: any) => (
                  <UserMealCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function RecipeCard({ recipe, featured = false }: { recipe: Recipe; featured?: boolean }) {
  return (
    <Card className={`group hover:shadow-lg transition-shadow cursor-pointer ${featured ? 'ring-2 ring-yellow-500' : ''}`}>
      <CardHeader className="p-0">
        <div className="h-48 bg-gradient-to-br from-orange-400 to-red-500 rounded-t-lg flex items-center justify-center relative overflow-hidden">
          {recipe.image ? (
            <img 
              src={recipe.image} 
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ChefHat className="h-16 w-16 text-white opacity-50" />
          )}
          {featured && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-yellow-500 text-yellow-900">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            </div>
          )}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-black/50 text-white">
              {recipe.category}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-fit-green transition-colors">
            {recipe.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {recipe.description}
          </p>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {recipe.prepTime + recipe.cookTime}m
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {recipe.servings}
            </div>
          </div>
          <Badge variant="outline" className={`
            ${recipe.difficulty === 'easy' ? 'border-green-500 text-green-700' : ''}
            ${recipe.difficulty === 'medium' ? 'border-yellow-500 text-yellow-700' : ''}
            ${recipe.difficulty === 'hard' ? 'border-red-500 text-red-700' : ''}
          `}>
            {recipe.difficulty}
          </Badge>
        </div>

        {recipe.calories && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Nutrition per serving:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {recipe.calories} cal
            </span>
          </div>
        )}

        {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.dietaryTags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {recipe.dietaryTags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{recipe.dietaryTags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UserMealCard({ post }: { post: any }) {
  return (
    <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="p-0">
        <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500 rounded-t-lg flex items-center justify-center relative overflow-hidden">
          {post.images && post.images.length > 0 ? (
            <img 
              src={post.images[0]} 
              alt="User meal"
              className="w-full h-full object-cover"
            />
          ) : (
            <ChefHat className="h-16 w-16 text-white opacity-50" />
          )}
          <div className="absolute top-2 left-2">
            <Badge className="bg-fit-green text-white">
              Community
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-fit-green transition-colors">
            {post.nutritionData?.mealType || "Healthy Meal"}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {post.caption}
          </p>
        </div>

        {post.nutritionData && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Calories:</span>
              <span className="font-medium ml-1">{post.nutritionData.calories}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Protein:</span>
              <span className="font-medium ml-1">{post.nutritionData.protein}g</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Shared by community</span>
          <Badge variant="outline" className="border-fit-green text-fit-green">
            Free
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}