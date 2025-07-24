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
import { AIExerciseGenerator } from "@/components/ai-exercise-generator";
import type { User } from "@shared/schema";

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
          <TabsTrigger value="ai-exercises" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Exercises
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

        <TabsContent value="ai-exercises" className="mt-4">
          <AIExerciseGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
