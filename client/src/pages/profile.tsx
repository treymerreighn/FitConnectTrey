import { useQuery } from "@tanstack/react-query";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PostCard } from "@/components/ui/post-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CURRENT_USER_ID } from "@/lib/constants";
import type { Post, User } from "@shared/schema";

export default function Profile() {
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: [`/api/users/${CURRENT_USER_ID}`],
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: [`/api/users/${CURRENT_USER_ID}/posts`],
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-32 h-6" />
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-40 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-6">
          <div className="flex items-start space-x-4">
            <UserAvatar
              src={user.avatar}
              name={user.name}
              className="w-20 h-20 border-2 border-fit-green"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                  <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
                </div>
                <Button variant="outline" size="sm">
                  Edit Profile
                </Button>
              </div>
              
              <div className="mt-3 flex space-x-6">
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">{posts.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Posts</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">{user.followers.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">{user.following.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Following</div>
                </div>
              </div>
              
              {user.bio && (
                <p className="mt-3 text-gray-700 dark:text-gray-300 text-sm">{user.bio}</p>
              )}
              
              {user.fitnessGoals && user.fitnessGoals.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {user.fitnessGoals.map((goal) => (
                    <span
                      key={goal}
                      className="px-2 py-1 bg-fit-green/10 text-fit-green text-xs rounded-full"
                    >
                      {goal}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Posts</h2>
        
        {postsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="w-24 h-4" />
                    <Skeleton className="w-16 h-3" />
                  </div>
                </div>
                <Skeleton className="w-full h-80 rounded-lg" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No posts yet. Start sharing your fitness journey!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
