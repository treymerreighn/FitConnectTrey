import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, MessageCircle, Dumbbell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PostCard } from "@/components/ui/post-card";
import { CreatePostModal } from "@/components/ui/create-post-modal";
import type { Post, User } from "@shared/schema";

export default function Feed() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const getActiveUsers = () => {
    // Show users who have posted recently (for stories)
    const recentPosters = posts.slice(0, 4).map(post => 
      users.find(user => user.id === post.userId)
    ).filter(Boolean) as User[];
    
    // Add current user at the beginning
    const currentUser = users.find(user => user.id === "user1");
    if (currentUser) {
      return [currentUser, ...recentPosters.filter(user => user.id !== currentUser.id)];
    }
    return recentPosters;
  };

  const activeUsers = getActiveUsers();

  if (postsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="fixed top-0 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-fit-green rounded-lg flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">FitConnect</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Heart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </Button>
              <Button variant="ghost" size="sm" className="relative">
                <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-fit-blue rounded-full text-xs text-white flex items-center justify-center">
                  5
                </span>
              </Button>
            </div>
          </div>
        </header>

        {/* Loading Content */}
        <main className="pt-16 pb-20">
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4">
            <div className="px-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Today's Workouts</h2>
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex-shrink-0 text-center">
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <Skeleton className="w-12 h-3 mt-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-4 py-4 px-4">
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
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-fit-green rounded-lg flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">FitConnect</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="relative">
              <Heart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </Button>
            <Button variant="ghost" size="sm" className="relative">
              <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-fit-blue rounded-full text-xs text-white flex items-center justify-center">
                5
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 pb-20">
        {/* Stories Row */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4">
          <div className="px-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Today's Workouts</h2>
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {activeUsers.map((user, index) => (
                <div key={user.id} className="flex-shrink-0 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-fit-green to-fit-blue p-0.5">
                    <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-0.5">
                      <UserAvatar
                        src={user.avatar}
                        name={user.name}
                        className="w-full h-full border-0"
                        size="lg"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {index === 0 ? "Your Story" : user.name.split(" ")[0]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feed Posts */}
        <div className="space-y-4 py-4 px-4">
          {posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No posts yet. Be the first to share your fitness journey!</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-4 z-40">
        <Button 
          className="w-14 h-14 bg-fit-green hover:bg-fit-green/90 text-white rounded-full shadow-lg"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
