import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Utensils, Share2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import ShareMealModal from "@/components/share-meal-modal";
import TopHeader from "@/components/TopHeader";
import { OptimizedImage } from "@/components/OptimizedImage";
import type { User } from "@shared/schema";

interface CommunityMeal {
  id: string;
  userId: string;
  caption: string;
  imageUrl?: string;
  ingredients: string[];
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  likes: string[];
  comments: any[];
  isPostedToFeed?: boolean;
  createdAt: Date;
}

export default function MealsPage() {
  const [isShareMealModalOpen, setIsShareMealModalOpen] = useState(false);

  const { data: communityMeals = [], isLoading } = useQuery<CommunityMeal[]>({
    queryKey: ["/api/meals"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const getUserById = (id: string) => users.find(user => user.id === id);

  const handleShareMeal = () => {
    setIsShareMealModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="pt-4 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Community Meals</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Share your meals and discover recipes from the community
              </p>
            </div>
            <Button
              onClick={handleShareMeal}
              className="bg-fit-green hover:bg-fit-green/90 text-white"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Meal
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-0">
                    <div className="aspect-video w-full bg-gray-200 dark:bg-gray-700" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && communityMeals.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Utensils className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      No community meals yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                      Be the first to share a delicious meal with the community! Post your recipes, food photos, and macro information.
                    </p>
                  </div>
                  <Button
                    onClick={handleShareMeal}
                    className="bg-fit-green hover:bg-fit-green/90 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Share Your First Meal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Meals Grid */}
          {!isLoading && communityMeals.length > 0 && (
            <div className="grid gap-4">
              {communityMeals.map((meal) => {
                const user = getUserById(meal.userId);
                const hasMacros = meal.calories || meal.protein || meal.carbs || meal.fat;
                
                return (
                  <Card key={meal.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      {/* Meal Image */}
                      {meal.imageUrl && (
                        <div className="aspect-video w-full overflow-hidden">
                          <OptimizedImage
                            src={meal.imageUrl}
                            alt={meal.caption}
                            width={800}
                            height={450}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="p-4 space-y-4">
                        {/* User Info */}
                        <div className="flex items-center space-x-3">
                          <UserAvatar 
                            src={user?.avatar}
                            name={user?.name || "Unknown User"}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user?.name || "Unknown User"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              @{user?.username || "unknown"}
                            </p>
                          </div>
                        </div>

                        {/* Caption */}
                        <p className="text-gray-800 dark:text-gray-200">
                          {meal.caption}
                        </p>

                        {/* Ingredients */}
                        {meal.ingredients.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white text-sm mb-2">
                              Ingredients:
                            </h5>
                            <div className="flex flex-wrap gap-1">
                              {meal.ingredients.slice(0, 5).map((ingredient, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {ingredient}
                                </Badge>
                              ))}
                              {meal.ingredients.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{meal.ingredients.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Nutrition Info */}
                        {hasMacros && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            {meal.calories && (
                              <div className="text-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Calories</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{meal.calories}</p>
                              </div>
                            )}
                            {meal.protein && (
                              <div className="text-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Protein</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{meal.protein}g</p>
                              </div>
                            )}
                            {meal.carbs && (
                              <div className="text-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Carbs</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{meal.carbs}g</p>
                              </div>
                            )}
                            {meal.fat && (
                              <div className="text-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Fat</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{meal.fat}g</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-4 z-40">
        <Button 
          className="w-16 h-16 bg-gradient-to-r from-fit-green to-emerald-500 hover:from-fit-green/90 hover:to-emerald-500/90 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105"
          onClick={handleShareMeal}
        >
          <Plus className="w-7 h-7" />
        </Button>
      </div>

      {/* Share Meal Modal */}
      <ShareMealModal
        isOpen={isShareMealModalOpen}
        onClose={() => setIsShareMealModalOpen(false)}
      />
    </div>
  );
}
