import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Utensils, Plus, Bookmark, Heart, MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import ShareMealModal from "@/components/share-meal-modal";
import TopHeader from "@/components/TopHeader";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CURRENT_USER_ID } from "@/lib/constants";
import type { User } from "@shared/schema";

// Helper function to format time ago
const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
};

interface CommunityMeal {
  id: string;
  userId: string;
  title: string;
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
  const [location, setLocation] = useLocation();
  const [isShareMealModalOpen, setIsShareMealModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check URL parameter to auto-open modal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('create') === 'true') {
      setIsShareMealModalOpen(true);
      // Clean up URL
      setLocation('/meals');
    }
  }, [location, setLocation]);

  const { data: communityMeals = [], isLoading } = useQuery<CommunityMeal[]>({
    queryKey: ["/api/community-meals"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch saved meals to check if a meal is already saved
  const { data: savedMeals = [] } = useQuery<any[]>({
    queryKey: ["/api/saved-meals", CURRENT_USER_ID],
    queryFn: async () => {
      const response = await fetch(`/api/saved-meals?userId=${CURRENT_USER_ID}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch saved meals');
      return response.json();
    },
  });

  const saveMealMutation = useMutation({
    mutationFn: async (meal: CommunityMeal) => {
      return apiRequest("POST", "/api/saved-meals", {
        userId: CURRENT_USER_ID,
        mealId: meal.id,
        dataSnapshot: meal,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-meals", CURRENT_USER_ID] });
      toast({ title: "Meal Saved!", description: "Check it in your Saved Meals collection" });
    },
    onError: () => {
      toast({ title: "Failed to save", description: "Please try again", variant: "destructive" });
    },
  });

  const unsaveMealMutation = useMutation({
    mutationFn: async (savedMealId: string) => {
      return apiRequest("DELETE", `/api/saved-meals/${savedMealId}?userId=${CURRENT_USER_ID}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-meals", CURRENT_USER_ID] });
      toast({ title: "Meal Removed", description: "Removed from your Saved Meals" });
    },
    onError: () => {
      toast({ title: "Failed to remove", description: "Please try again", variant: "destructive" });
    },
  });

  const isMealSaved = (mealId: string) => savedMeals.some((sm: any) => sm.mealId === mealId);
  const getSavedMealId = (mealId: string) => savedMeals.find((sm: any) => sm.mealId === mealId)?.id;

  const handleToggleSaveMeal = (meal: CommunityMeal) => {
    if (isMealSaved(meal.id)) {
      const savedMealId = getSavedMealId(meal.id);
      if (savedMealId) unsaveMealMutation.mutate(savedMealId);
    } else {
      saveMealMutation.mutate(meal);
    }
  };

  const getUserById = (id: string) => users.find(user => user.id === id);

  // Sort meals: most liked from past 24 hours at top, then by recency
  const sortedMeals = [...communityMeals].sort((a, b) => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const aDate = new Date(a.createdAt);
    const bDate = new Date(b.createdAt);
    
    const aIsRecent = aDate >= twentyFourHoursAgo;
    const bIsRecent = bDate >= twentyFourHoursAgo;
    
    // Both are from past 24 hours - sort by likes
    if (aIsRecent && bIsRecent) {
      return (b.likes?.length || 0) - (a.likes?.length || 0);
    }
    
    // Only a is recent - a comes first
    if (aIsRecent) return -1;
    
    // Only b is recent - b comes first
    if (bIsRecent) return 1;
    
    // Neither is recent - sort by date (newest first)
    return bDate.getTime() - aDate.getTime();
  });

  const handleShareMeal = () => {
    setIsShareMealModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header - extends to top of screen */}
      <div className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex-1 flex justify-start">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation("/saved-meals")}
              className="border-zinc-300 dark:border-zinc-700"
            >
              <Bookmark className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Saved</span>
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white text-center flex-1 whitespace-nowrap">MEALS</h1>
          <div className="flex-1 flex justify-end">
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white" 
              size="sm"
              onClick={handleShareMeal}
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Meal</span>
            </Button>
          </div>
        </div>
      </div>

      <main className="pb-20">
        <div className="space-y-6 pt-4">

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4 px-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-0">
                    <div className="aspect-[4/5] w-full bg-gray-200 dark:bg-gray-700" />
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
            <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700 mx-4">
              <CardContent className="p-12 text-center">
                <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No community meals yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
                  Be the first to share a delicious meal with the community! Post your recipes, food photos, and macro information.
                </p>
                <Button
                  onClick={handleShareMeal}
                  className="bg-fit-green hover:bg-fit-green/90 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Share Your First Meal
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Meals Grid */}
          {!isLoading && communityMeals.length > 0 && (
            <div className="grid gap-4">
              {sortedMeals.map((meal) => {
                const user = getUserById(meal.userId);
                const hasMacros = meal.calories !== undefined || meal.protein !== undefined || meal.carbs !== undefined || meal.fat !== undefined;
                const likesCount = meal.likes?.length || 0;
                const commentsCount = meal.comments?.length || 0;
                
                return (
                  <Card key={meal.id} className="w-full border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Link href={`/profile/${user?.id}`} asChild>
                          <div className="flex items-center space-x-3 cursor-pointer">
                            <UserAvatar 
                              src={user?.avatar}
                              name={user?.name || "Unknown User"}
                              alt={`${user?.name || "Unknown User"}'s avatar`}
                            />
                            <div>
                              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                {user?.name || "Unknown User"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTimeAgo(meal.createdAt)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-fit-blue text-white text-xs px-2 py-1">
                            <span className="mr-1">🍎</span>
                            Nutrition
                          </Badge>
                          {meal.title && (
                            <span className="font-semibold text-sm text-gray-900 dark:text-white">
                              {meal.title}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 dark:text-gray-100">{meal.caption}</p>
                      </div>
                    </CardHeader>

                    {/* Meal Image */}
                    {meal.imageUrl && (
                      <div className="px-0">
                        <OptimizedImage
                          src={meal.imageUrl}
                          alt={meal.caption}
                          width={800}
                          height={1000}
                          className="w-full aspect-[4/5] rounded-md overflow-hidden"
                          placeholder="blur"
                        />
                      </div>
                    )}

                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto text-gray-600 hover:text-red-500"
                          >
                            <Heart className="h-5 w-5 mr-1" />
                            <span className="font-medium">{likesCount}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto text-gray-600 hover:text-gray-800"
                          >
                            <MessageCircle className="h-5 w-5 mr-1" />
                            <span>{commentsCount}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto text-gray-600 hover:text-gray-800 -ml-2"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleSaveMeal(meal)}
                          className={`p-0 h-auto ${isMealSaved(meal.id) ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-600`}
                        >
                          <Bookmark className={`h-5 w-5 ${isMealSaved(meal.id) ? 'fill-current' : ''}`} />
                        </Button>
                      </div>

                      {/* Meal Details */}
                      {(meal.ingredients.length > 0 || hasMacros) && (
                        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 mt-3">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">
                            Nutrition Facts
                          </h4>

                          {/* Ingredients */}
                          {meal.ingredients.length > 0 && (
                            <div className="mb-2">
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
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                              {meal.calories !== undefined && (
                                <div className="text-center">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Calories</p>
                                  <p className="font-semibold text-gray-900 dark:text-white">{meal.calories}</p>
                                </div>
                              )}
                              {meal.protein !== undefined && (
                                <div className="text-center">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Protein</p>
                                  <p className="font-semibold text-gray-900 dark:text-white">{meal.protein}g</p>
                                </div>
                              )}
                              {meal.carbs !== undefined && (
                                <div className="text-center">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Carbs</p>
                                  <p className="font-semibold text-gray-900 dark:text-white">{meal.carbs}g</p>
                                </div>
                              )}
                              {meal.fat !== undefined && (
                                <div className="text-center">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Fat</p>
                                  <p className="font-semibold text-gray-900 dark:text-white">{meal.fat}g</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Share Meal Modal */}
      <ShareMealModal
        isOpen={isShareMealModalOpen}
        onClose={() => setIsShareMealModalOpen(false)}
      />
    </div>
  );
}
