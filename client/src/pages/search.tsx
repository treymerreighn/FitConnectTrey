import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Link } from "@/components/ui/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CURRENT_USER_ID } from "@/lib/constants";
import type { User } from "@shared/schema";

import { useAuth } from "@/hooks/useAuth";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
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
      {/* Header - extends to top of screen */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex-1"></div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center flex-1">DISCOVER</h1>
          <div className="flex-1"></div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
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
      </div>
    </div>
  );
}

