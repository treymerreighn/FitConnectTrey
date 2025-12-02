import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, Share2, Heart, MessageCircle, Utensils, Crown, Dumbbell } from "lucide-react";
import { Link } from "@/components/ui/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { PostCard } from "@/components/ui/post-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CURRENT_USER_ID } from "@/lib/constants";
import type { User, Recipe, CommunityMeal, Post } from "@shared/schema";

import ShareMealModal from "@/components/share-meal-modal";
import { useAuth } from "@/hooks/useAuth";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isShareMealModalOpen, setIsShareMealModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const usersQueryKey = ["/api/users"] as const;
  const FOLLOW_BUTTON_BASE_CLASS = "min-w-[110px] text-sm font-medium border transition-colors disabled:opacity-80";
  const { user: authUser } = useAuth();
  const authUserId = (authUser as User | undefined)?.id;
  const viewerId = authUserId || CURRENT_USER_ID;
  
  const getFollowButtonClass = (isFollowing: boolean) =>
    `${FOLLOW_BUTTON_BASE_CLASS} ${
      isFollowing
        ? "bg-gray-200 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:border-gray-700"
        : "bg-fit-green text-white border-fit-green hover:bg-fit-green/90 dark:border-fit-green"
    }`;

  // Fetch all users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: usersQueryKey,
  });
  
  // Fetch current viewer data
  const { data: viewerData } = useQuery<User>({
    queryKey: ["/api/users", viewerId],
    queryFn: () => apiRequest("GET", `/api/users/${viewerId}`),
    enabled: Boolean(viewerId),
  });

  // Fetch all posts for workout filtering
  const { data: allPosts = [] } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  // Filter workout posts
  const workoutPosts = allPosts.filter(post => post.type === 'workout');

  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    return (
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Get following list directly from viewer data
  const currentFollowing = viewerData?.following ?? [];

  const computeIsFollowing = (userId: string) => {
    return currentFollowing.includes(userId);
  };

  // Fetch community meals
  const { data: communityMeals = [] } = useQuery<CommunityMeal[]>({
    queryKey: ["/api/community-meals"],
  });

  const followMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const isFollowing = computeIsFollowing(targetUserId);
      console.log('[Follow Mutation] Target:', targetUserId, 'Currently Following:', isFollowing, 'Viewer ID:', viewerId);
      if (isFollowing) {
        const result = await apiRequest("POST", `/api/users/${targetUserId}/unfollow`, { followerId: viewerId });
        console.log('[Follow Mutation] Unfollow result:', result);
        return result;
      } else {
        const result = await apiRequest("POST", `/api/users/${targetUserId}/follow`, { followerId: viewerId });
        console.log('[Follow Mutation] Follow result:', result);
        return result;
      }
    },
    onMutate: async (targetUserId: string) => {
      console.log('[onMutate] Starting optimistic update for:', targetUserId);
      
      // Cancel outgoing queries for all relevant keys
      await queryClient.cancelQueries({ queryKey: ["/api/users", viewerId] });
      await queryClient.cancelQueries({ queryKey: [`/api/users/${viewerId}`] });
      await queryClient.cancelQueries({ queryKey: usersQueryKey });

      // Snapshot previous values
      const previousViewer = queryClient.getQueryData<User>(["/api/users", viewerId]);
      const previousUsers = queryClient.getQueryData<User[]>(usersQueryKey);

      console.log('[onMutate] Previous viewer following:', previousViewer?.following);

      const currentlyFollowing = computeIsFollowing(targetUserId);
      console.log('[onMutate] Currently following:', currentlyFollowing);

      // Optimistically update viewer's following list
      if (previousViewer) {
        const updatedFollowing = currentlyFollowing
          ? previousViewer.following?.filter(id => id !== targetUserId) || []
          : [...(previousViewer.following || []), targetUserId];
        
        console.log('[onMutate] Updated following list:', updatedFollowing);
        
        const updatedViewer = { ...previousViewer, following: updatedFollowing };
        queryClient.setQueryData(["/api/users", viewerId], updatedViewer);
        queryClient.setQueryData([`/api/users/${viewerId}`], updatedViewer);
      }

      // Optimistically update target user's followers list in users array
      if (previousUsers) {
        const updatedUsers = previousUsers.map(u => {
          if (u.id === targetUserId) {
            const updatedFollowers = currentlyFollowing
              ? u.followers?.filter(id => id !== viewerId) || []
              : [...(u.followers || []), viewerId];
            return { ...u, followers: updatedFollowers };
          }
          return u;
        });
        queryClient.setQueryData(usersQueryKey, updatedUsers);
      }

      return { previousViewer, previousUsers };
    },
    onError: (_err, _targetUserId, context: any) => {
      // Rollback on error
      if (context?.previousViewer) {
        queryClient.setQueryData(["/api/users", viewerId], context.previousViewer);
        queryClient.setQueryData([`/api/users/${viewerId}`], context.previousViewer);
      }
      if (context?.previousUsers) {
        queryClient.setQueryData(usersQueryKey, context.previousUsers);
      }
    },
    onSuccess: async (_data, targetUserId) => {
      console.log('[onSuccess] Follow operation succeeded, invalidating queries');
      
      // Invalidate all relevant queries to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ["/api/users", viewerId] });
      await queryClient.invalidateQueries({ queryKey: [`/api/users/${viewerId}`] });
      await queryClient.invalidateQueries({ queryKey: ["/api/users", targetUserId] });
      await queryClient.invalidateQueries({ queryKey: [`/api/users/${targetUserId}`] });
      await queryClient.invalidateQueries({ queryKey: usersQueryKey });
      
      // Force refetch viewer data
      const updatedViewer = await queryClient.fetchQuery({
        queryKey: ["/api/users", viewerId],
        queryFn: () => apiRequest("GET", `/api/users/${viewerId}`),
      });
      
      console.log('[onSuccess] Refetched viewer following list:', updatedViewer.following);
    },
  });

  const visibleUsers = filteredUsers.filter((user) => user.id !== viewerId);
  const suggestedUsers = filteredUsers
    .filter((user) => {
      if (user.id === viewerId) return false;
      return !computeIsFollowing(user.id);
    })
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1"></div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center flex-1">DISCOVER</h1>
          <div className="flex-1"></div>
        </div>
      </header>

      <Tabs defaultValue="users" className="px-4 py-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Find Users
          </TabsTrigger>
          <TabsTrigger value="community-workouts" className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-blue-600" />
            Workouts
          </TabsTrigger>
          <TabsTrigger value="community-meals" className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-green-600" />
            Meals
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

          <div className="py-2">
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
                                {user.location && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {user.location}
                                  </p>
                                )}
                                {user.bio && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
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
                                {user.location && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {user.location}
                                  </p>
                                )}
                                {user.bio && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
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

        <TabsContent value="community-workouts" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Community Workouts</h2>
            </div>
            
            {workoutPosts.length === 0 ? (
              <Card className="p-8 text-center">
                <CardContent>
                  <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No community workouts yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Be the first to share your workout with the community!
                  </p>
                  <Link href="/workouts">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Dumbbell className="h-4 w-4 mr-2" />
                      Create Workout
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {workoutPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
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
      </Tabs>

      <ShareMealModal 
        isOpen={isShareMealModalOpen}
        onClose={() => setIsShareMealModalOpen(false)}
      />
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
