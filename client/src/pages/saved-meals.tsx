import { useLocation } from "wouter";
import { Trash2, Calendar, Utensils, ArrowLeft, Bookmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CURRENT_USER_ID } from "@/lib/constants";
import { OptimizedImage } from "@/components/OptimizedImage";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { User } from "@shared/schema";

interface SavedMeal {
  id: string;
  userId: string;
  mealId: string;
  dataSnapshot?: any;
  createdAt: string;
}

export default function SavedMeals() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedMeals = [], isLoading } = useQuery<SavedMeal[]>({
    queryKey: ["/api/saved-meals", CURRENT_USER_ID],
    queryFn: async () => {
      const response = await fetch(`/api/saved-meals?userId=${CURRENT_USER_ID}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch saved meals');
      return response.json();
    },
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/saved-meals/${id}?userId=${CURRENT_USER_ID}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/saved-meals", CURRENT_USER_ID] }),
  });

  const getUserById = (id: string) => users.find(user => user.id === id);

  const handleDeleteMeal = (mealId: string) => {
    deleteMutation.mutate(mealId, {
      onSuccess: () =>
        toast({ title: "Meal Removed", description: "Removed from your saved collection" }),
      onError: () =>
        toast({ title: "Failed to remove", description: "Please try again", variant: "destructive" }),
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/meals")}
              className="text-gray-500 dark:text-gray-400"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Meals</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {savedMeals.length} meal{savedMeals.length !== 1 ? 's' : ''} saved
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Meals List */}
      <div className="p-4 space-y-4 pb-20">
        {isLoading ? (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center text-gray-500 dark:text-gray-400">Loading...</CardContent>
          </Card>
        ) : savedMeals.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <Utensils className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Saved Meals</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Start saving meals from the community feed to build your collection
              </p>
              <Button onClick={() => setLocation("/meals")} className="bg-fit-green hover:bg-fit-green/90">
                Explore Community Meals
              </Button>
            </CardContent>
          </Card>
        ) : (
          savedMeals.map(savedMeal => {
            const mealData = savedMeal.dataSnapshot;
            if (!mealData) return null;
            
            const user = getUserById(mealData.userId);
            const hasMacros = mealData.calories || mealData.protein || mealData.carbs || mealData.fat;
            
            return (
              <Card key={savedMeal.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 overflow-hidden">
                <CardContent className="p-0">
                  {/* Meal Image */}
                  {mealData.imageUrl && (
                    <div className="aspect-video w-full overflow-hidden">
                      <OptimizedImage
                        src={mealData.imageUrl}
                        alt={mealData.caption}
                        width={800}
                        height={450}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-4 space-y-4">
                    {/* User Info & Delete Button */}
                    <div className="flex items-center justify-between">
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
                            Saved {formatDate(savedMeal.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMeal(savedMeal.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Caption */}
                    <p className="text-gray-800 dark:text-gray-200">
                      {mealData.caption}
                    </p>

                    {/* Ingredients */}
                    {mealData.ingredients?.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white text-sm mb-2">
                          Ingredients:
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {mealData.ingredients.slice(0, 5).map((ingredient: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {ingredient}
                            </Badge>
                          ))}
                          {mealData.ingredients.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{mealData.ingredients.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Nutrition Info */}
                    {hasMacros && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        {mealData.calories && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Calories</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{mealData.calories}</p>
                          </div>
                        )}
                        {mealData.protein && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Protein</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{mealData.protein}g</p>
                          </div>
                        )}
                        {mealData.carbs && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Carbs</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{mealData.carbs}g</p>
                          </div>
                        )}
                        {mealData.fat && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Fat</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{mealData.fat}g</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
