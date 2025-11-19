import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, Brain, Share2, Heart, MessageCircle, Utensils, Crown } from "lucide-react";
import { Link } from "@/components/ui/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CURRENT_USER_ID } from "@/lib/constants";
import type { User, Recipe, CommunityMeal } from "@shared/schema";
import { MealHelper } from "@/components/meal-helper";
import ShareMealModal from "@/components/share-meal-modal";
import { useAuth } from "@/hooks/useAuth";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isShareMealModalOpen, setIsShareMealModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const usersQueryKey = ["/api/users"] as const;
  const FOLLOW_BUTTON_BASE_CLASS = "min-w-[110px] text-sm font-medium border transition-colors disabled:opacity-80";
  const [sessionFollowState, setSessionFollowState] = useState<Map<string, boolean>>(() => new Map());
  const { user: authUser } = useAuth();
  const authUserId = (authUser as User | undefined)?.id;
  const canonicalViewerId = authUserId || CURRENT_USER_ID;
  const getFollowButtonClass = (isFollowing: boolean) =>
    `${FOLLOW_BUTTON_BASE_CLASS} ${
      isFollowing
        ? "bg-gray-200 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:border-gray-700"
        : "bg-fit-green text-white border-fit-green hover:bg-fit-green/90 dark:border-fit-green"
    }`;

  const { data: users = [] } = useQuery<User[]>({
    queryKey: usersQueryKey,
  });
  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    return (
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const { data: viewerData } = useQuery<User>({
    queryKey: [`/api/users/${canonicalViewerId}`],
  });

  const resolvedViewer =
    viewerData ||
    (authUserId ? filteredUsers.find((u) => u.id === authUserId) : undefined) ||
    filteredUsers.find((u) => u.id === CURRENT_USER_ID) ||
    null;

  const viewerId = resolvedViewer?.id || authUserId || CURRENT_USER_ID;
  const viewerKeyTuple = ["/api/users", viewerId] as const;
  const viewerKeyString = [`/api/users/${viewerId}`] as const;
  const fallbackViewerTuple = viewerId === canonicalViewerId ? null : (["/api/users", canonicalViewerId] as const);
  const fallbackViewerString = viewerId === canonicalViewerId ? null : ([`/api/users/${canonicalViewerId}`] as const);

  const resolvedFollowing = resolvedViewer?.following ?? [];

  const computeIsFollowing = (userId: string) => {
    if (sessionFollowState.has(userId)) {
      return sessionFollowState.get(userId)!;
    }
    return resolvedFollowing.includes(userId);
  };

  // Fetch community meals
  const { data: communityMeals = [] } = useQuery<CommunityMeal[]>({
    queryKey: ["/api/community-meals"],
  });

  const followMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const isFollowing = computeIsFollowing(targetUserId);
      const endpoint = isFollowing ? "unfollow" : "follow";
      return apiRequest("POST", `/api/users/${targetUserId}/${endpoint}`, { followerId: viewerId });
    },
    onMutate: async (targetUserId: string) => {
      await queryClient.cancelQueries({ queryKey: viewerKeyTuple });
      await queryClient.cancelQueries({ queryKey: viewerKeyString });
      if (fallbackViewerTuple) await queryClient.cancelQueries({ queryKey: fallbackViewerTuple });
      if (fallbackViewerString) await queryClient.cancelQueries({ queryKey: fallbackViewerString });
      await queryClient.cancelQueries({ queryKey: usersQueryKey });

      const previousViewerArray = queryClient.getQueryData<User>(viewerKeyTuple);
      const previousViewerString = queryClient.getQueryData<User>(viewerKeyString);
      const previousFallbackArray = fallbackViewerTuple
        ? queryClient.getQueryData<User>(fallbackViewerTuple)
        : undefined;
      const previousFallbackString = fallbackViewerString
        ? queryClient.getQueryData<User>(fallbackViewerString)
        : undefined;
      const previousUsers = queryClient.getQueryData<User[]>(usersQueryKey);
      const previousSessionFollowState = new Map(sessionFollowState);

      const currentlyFollowing = computeIsFollowing(targetUserId);

      const adjustFollowing = (user?: User | null) => {
        if (!user) return user;
        const next = new Set(user.following || []);
        if (currentlyFollowing) {
          next.delete(targetUserId);
        } else {
          next.add(targetUserId);
        }
        return { ...user, following: Array.from(next) } as User;
      };

      const viewerArrayNext = adjustFollowing(previousViewerArray);
      if (viewerArrayNext) {
        queryClient.setQueryData(viewerKeyTuple, viewerArrayNext);
      }
      const viewerStringNext = adjustFollowing(previousViewerString);
      if (viewerStringNext) {
        queryClient.setQueryData(viewerKeyString, viewerStringNext);
      }
      if (fallbackViewerTuple) {
        const fallbackArrayNext = adjustFollowing(previousFallbackArray);
        if (fallbackArrayNext) {
          queryClient.setQueryData(fallbackViewerTuple, fallbackArrayNext);
        }
      }
      if (fallbackViewerString) {
        const fallbackStringNext = adjustFollowing(previousFallbackString);
        if (fallbackStringNext) {
          queryClient.setQueryData(fallbackViewerString, fallbackStringNext);
        }
      }

      if (previousUsers) {
        const updated = previousUsers.map((u) => {
          if (u.id !== targetUserId) return u;
          const followerSet = new Set(u.followers || []);
          if (currentlyFollowing) {
            followerSet.delete(viewerId);
          } else {
            followerSet.add(viewerId);
          }
          return { ...u, followers: Array.from(followerSet) };
        });
        queryClient.setQueryData(usersQueryKey, updated);
      }

      setSessionFollowState((prev) => {
        const next = new Map(prev);
        next.set(targetUserId, !currentlyFollowing);
        return next;
      });

      return {
        previousViewerArray,
        previousViewerString,
        previousFallbackArray,
        previousFallbackString,
        previousUsers,
        previousSessionFollowState,
      };
    },
    onError: (_err, _targetUserId, context: any) => {
      if (context?.previousViewerArray) {
        queryClient.setQueryData(viewerKeyTuple, context.previousViewerArray);
      }
      if (context?.previousViewerString) {
        queryClient.setQueryData(viewerKeyString, context.previousViewerString);
      }
      if (fallbackViewerTuple && context?.previousFallbackArray) {
        queryClient.setQueryData(fallbackViewerTuple, context.previousFallbackArray);
      }
      if (fallbackViewerString && context?.previousFallbackString) {
        queryClient.setQueryData(fallbackViewerString, context.previousFallbackString);
      }
      if (context?.previousUsers) {
        queryClient.setQueryData(usersQueryKey, context.previousUsers);
      }
      if (context?.previousSessionFollowState) {
        setSessionFollowState(new Map(context.previousSessionFollowState));
      }
    },
    onSettled: (_, __, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey });
      queryClient.invalidateQueries({ queryKey: viewerKeyTuple });
      queryClient.invalidateQueries({ queryKey: viewerKeyString });
      if (fallbackViewerTuple) {
        queryClient.invalidateQueries({ queryKey: fallbackViewerTuple });
      }
      if (fallbackViewerString) {
        queryClient.invalidateQueries({ queryKey: fallbackViewerString });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/users", targetUserId] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${targetUserId}`] });
    },
  });

  const visibleUsers = filteredUsers.filter((user) => user.id !== viewerId);
  const suggestedUsers = filteredUsers
    .filter((user) => {
      if (user.id === viewerId) return false;
      const isFollowing = computeIsFollowing(user.id);
      if (!isFollowing) return true;
      return sessionFollowState.get(user.id) === true;
    })
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Discover</h1>
      </header>

      <Tabs defaultValue="users" className="px-4 py-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Find Users
          </TabsTrigger>
          <TabsTrigger value="community-meals" className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-green-600" />
            Community Meals
          </TabsTrigger>
          <TabsTrigger value="meal-helper" className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-orange-500" />
            AI Meal Helper
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
            {visibleUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No users found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleUsers.map((user) => (
                  <Card key={user.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Link href={`/profile/${user.id}`} asChild>
                            <div className="flex items-center space-x-3 cursor-pointer">
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
                          </Link>
                        </div>
                        {
                          (() => {
                            const isFollowing = computeIsFollowing(user.id);
                            return (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => followMutation.mutate(user.id)}
                                disabled={followMutation.isPending}
                                className={getFollowButtonClass(isFollowing)}
                              >
                                {isFollowing ? "Following" : "Follow"}
                              </Button>
                            );
                          })()
                        }
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
                          <Link href={`/profile/${user.id}`} asChild>
                            <div className="flex items-center space-x-3 cursor-pointer">
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
                          </Link>
                        </div>
                        {
                          (() => {
                            const isFollowing = computeIsFollowing(user.id);
                            return (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => followMutation.mutate(user.id)}
                                disabled={followMutation.isPending}
                                className={getFollowButtonClass(isFollowing)}
                              >
                                {isFollowing ? "Following" : "Follow"}
                              </Button>
                            );
                          })()
                        }
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
          </div>
        </TabsContent>

        <TabsContent value="community-meals" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Community Meals</h2>
              <Button 
                onClick={() => setIsShareMealModalOpen(true)}
                variant="outline" 
                size="sm"
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Meal
              </Button>
            </div>
            
            {communityMeals.length === 0 ? (
              <Card className="p-8 text-center">
                <CardContent>
                  <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No community meals yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Be the first to share a delicious meal with the community!
                  </p>
                  <Button 
                    onClick={() => setIsShareMealModalOpen(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Your Meal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {communityMeals.map((meal) => (
                  <Card key={meal.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      {/* Meal Image */}
                      {meal.imageUrl && (
                        <div className="aspect-video relative">
                          <img
                            src={meal.imageUrl}
                            alt={meal.caption}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Meal Content */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <UserAvatar
                              src={users.find(u => u.id === meal.userId)?.avatar}
                              name={users.find(u => u.id === meal.userId)?.name || "Unknown User"}
                              size="sm"
                            />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {users.find(u => u.id === meal.userId)?.name || "Unknown User"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(meal.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Caption */}
                        <p className="text-gray-900 dark:text-white mb-3 text-sm leading-relaxed">
                          {meal.caption}
                        </p>
                        
                        {/* Ingredients */}
                        {meal.ingredients && meal.ingredients.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Ingredients:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {meal.ingredients.slice(0, 3).map((ingredient, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {ingredient}
                                </Badge>
                              ))}
                              {meal.ingredients.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{meal.ingredients.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Nutrition Info */}
                        {(meal.calories || meal.protein) && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                            {meal.calories && (
                              <div className="text-center py-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Calories</p>
                                <p className="font-medium text-sm text-gray-900 dark:text-white">
                                  {meal.calories}
                                </p>
                              </div>
                            )}
                            {meal.protein && (
                              <div className="text-center py-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Protein</p>
                                <p className="font-medium text-sm text-gray-900 dark:text-white">
                                  {meal.protein}g
                                </p>
                              </div>
                            )}
                            {meal.carbs && (
                              <div className="text-center py-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Carbs</p>
                                <p className="font-medium text-sm text-gray-900 dark:text-white">
                                  {meal.carbs}g
                                </p>
                              </div>
                            )}
                            {meal.fat && (
                              <div className="text-center py-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Fat</p>
                                <p className="font-medium text-sm text-gray-900 dark:text-white">
                                  {meal.fat}g
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Actions */}
                        <div className="flex items-center space-x-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500">
                            <Heart className="h-4 w-4 mr-1" />
                            <span className="text-xs">{meal.likes?.length || 0}</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-500">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">{meal.comments?.length || 0}</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="meal-helper" className="space-y-4 mt-4">
          <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-orange-900 dark:text-orange-100">AI Meal Helper - Premium Feature</h3>
            </div>
            <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
              Generate personalized healthy recipes with AI based on your dietary preferences and goals.
            </p>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              <Crown className="h-4 w-4 mr-2 text-yellow-300" />
              Upgrade to Premium
            </Button>
          </div>
          <MealHelper />
        </TabsContent>
      </Tabs>

      <ShareMealModal 
        isOpen={isShareMealModalOpen}
        onClose={() => setIsShareMealModalOpen(false)}
      />
    </div>
  );
}

function MealHelperTabContent({ onShareMeal }: { onShareMeal: () => void }) {
  const [activeTab, setActiveTab] = useState("ai-helper");

  const { data: communityMeals = [] } = useQuery<CommunityMeal[]>({
    queryKey: ["/api/community-meals"],
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center py-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Meal Helper & Recipes
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Get personalized AI-generated recipes and discover meals shared by our community
        </p>
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ai-helper" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Meal Helper
          </TabsTrigger>
          <TabsTrigger value="recipe-library" className="flex items-center gap-2">
            📚 Recipe Library
          </TabsTrigger>
          <TabsTrigger value="community-meals" className="flex items-center gap-2">
            👥 Community Meals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-helper" className="mt-4">
          <MealHelper />
        </TabsContent>

        <TabsContent value="recipe-library" className="mt-4">
          <HealthyRecipesTab />
        </TabsContent>

        <TabsContent value="community-meals" className="mt-4">
          <CommunityMealSharing 
            meals={communityMeals}
            onShareMeal={onShareMeal}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CommunityMealSharing({ meals, onShareMeal }: { meals: CommunityMeal[]; onShareMeal: () => void }) {
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const getUserById = (id: string) => users.find(user => user.id === id);

  if (meals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Utensils className="h-8 w-8 text-gray-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              No community meals yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Be the first to share a healthy meal with the community!
            </p>
          </div>
          <Button 
            onClick={onShareMeal}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Your Meal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Share Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Community Meal Sharing
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Free meals and recipes shared by our FitConnect community
          </p>
        </div>
        <Button 
          onClick={onShareMeal}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share Your Meal
        </Button>
      </div>

      {/* Community Meals Grid */}
      <div className="grid gap-4">
        {meals.map((meal) => {
          const user = getUserById(meal.userId);
          const hasMacros = meal.calories || meal.protein || meal.carbs || meal.fat;
          
          return (
            <Card key={meal.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Meal Image */}
                {meal.imageUrl && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img 
                      src={meal.imageUrl}
                      alt={meal.caption}
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

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">
                        <Heart className="h-4 w-4" />
                        <span className="text-sm">{meal.likes.length}</span>
                      </button>
                      <button className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm">{meal.comments.length}</span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(meal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
