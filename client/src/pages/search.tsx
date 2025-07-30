import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, UserPlus, Users, Brain } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CURRENT_USER_ID } from "@/lib/constants";
import type { User, Recipe } from "@shared/schema";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: [`/api/users/${CURRENT_USER_ID}`],
  });

  const followMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const isFollowing = currentUser?.following.includes(targetUserId);
      const endpoint = isFollowing ? "unfollow" : "follow";
      return apiRequest(`/api/users/${targetUserId}/${endpoint}`, {
        method: "POST",
        body: { followerId: CURRENT_USER_ID },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return user.id !== CURRENT_USER_ID;
    return (
      user.id !== CURRENT_USER_ID &&
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const suggestedUsers = users.filter(
    (user) => user.id !== CURRENT_USER_ID && !currentUser?.following.includes(user.id)
  ).slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Discover</h1>
      </header>

      <Tabs defaultValue="users" className="px-4 py-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Find Users
          </TabsTrigger>
          <TabsTrigger value="meal-helper" className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-orange-500" />
            Meal Helper
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 mt-4">
          <div className="flex items-center space-x-3 mb-4">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-none bg-gray-100 dark:bg-gray-700 focus:ring-0 focus:border-none"
            />
          </div>

      <div className="px-4 py-6">
        {/* Search Results */}
        {searchTerm && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Search Results
            </h2>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No users found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <Card key={user.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <UserAvatar
                            src={user.avatar}
                            name={user.name}
                            size="md"
                          />
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              @{user.username}
                            </p>
                            {user.bio && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {user.bio}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant={
                            currentUser?.following.includes(user.id) ? "outline" : "default"
                          }
                          size="sm"
                          onClick={() => followMutation.mutate(user.id)}
                          disabled={followMutation.isPending}
                          className={
                            currentUser?.following.includes(user.id)
                              ? ""
                              : "bg-fit-green hover:bg-fit-green/90"
                          }
                        >
                          {currentUser?.following.includes(user.id) ? (
                            <>
                              <Users className="w-4 h-4 mr-1" />
                              Following
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-1" />
                              Follow
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Suggested Users */}
        {!searchTerm && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Suggested for You
            </h2>
            {suggestedUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No suggestions available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {suggestedUsers.map((user) => (
                  <Card key={user.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <UserAvatar
                            src={user.avatar}
                            name={user.name}
                            size="md"
                          />
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              @{user.username}
                            </p>
                            {user.bio && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {user.bio}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => followMutation.mutate(user.id)}
                          disabled={followMutation.isPending}
                          className="bg-fit-green hover:bg-fit-green/90"
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Follow
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
        </TabsContent>

        <TabsContent value="meal-helper" className="space-y-4 mt-4">
          <MealHelperTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MealHelperTab() {
  return (
    <div className="space-y-4">
      <div className="text-center p-6 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
        <Brain className="h-12 w-12 text-orange-500 mx-auto mb-3" />
        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
          AI Meal Helper
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Tell us what you're craving and get a personalized healthy recipe instantly
        </p>
        <Button 
          onClick={() => window.location.href = '/recipes'}
          className="bg-orange-500 hover:bg-orange-600"
        >
          Try Meal Helper
        </Button>
      </div>
    </div>
  );
}

function HealthyRecipesTab() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: recipes = [], isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const { data: featuredRecipes = [] } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes/featured"],
  });

  const filteredRecipes = recipes.filter(recipe =>
    searchQuery === "" || 
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search healthy recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {featuredRecipes.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900 dark:text-white">Featured Healthy Recipes</h3>
          <div className="grid gap-3">
            {featuredRecipes.slice(0, 3).map((recipe) => (
              <RecipeSearchCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-medium text-gray-900 dark:text-white">
          {searchQuery ? `Search Results (${filteredRecipes.length})` : 'All Healthy Recipes'}
        </h3>
        <div className="grid gap-3">
          {filteredRecipes.map((recipe) => (
            <RecipeSearchCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </div>

      {filteredRecipes.length === 0 && searchQuery && (
        <div className="text-center py-8">
          <div className="text-orange-500 text-4xl mb-2">🍎</div>
          <p className="text-gray-500 dark:text-gray-400">No recipes found for "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}

function RecipeSearchCard({ recipe }: { recipe: Recipe }) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start space-x-3">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white text-2xl">🍽️</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                {recipe.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                {recipe.description}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              {recipe.servings}
            </span>
            <span className="flex items-center">
              ⏱️ {recipe.prepTime + recipe.cookTime}m
            </span>
            <span className="flex items-center">
              🔥 {recipe.calories} cal
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
