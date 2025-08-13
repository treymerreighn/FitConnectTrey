import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, MessageCircle, Dumbbell, Plus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PostCard } from "@/components/post-card";
import { CreatePostModal } from "@/components/create-post-modal";
import { Stories } from "@/components/stories";
import type { Post, User } from "@shared/schema";

export default function Home() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { data: posts = [], isLoading: postsLoading, error: postsError } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    retry: 2,
    refetchOnWindowFocus: true,
  });
  
  console.log("Posts data:", posts, "Loading:", postsLoading, "Error:", postsError);

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  if (postsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="fixed top-0 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-fit-green rounded-lg flex items-center justify-center shadow-sm">
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">FitConnect</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="relative hover:bg-gray-100 dark:hover:bg-gray-700">
                <Heart className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
                  3
                </span>
              </Button>
              <Button variant="ghost" size="sm" className="relative hover:bg-gray-100 dark:hover:bg-gray-700">
                <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-fit-blue rounded-full text-xs text-white flex items-center justify-center font-medium">
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
              <Heart className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </Button>
            <Button variant="ghost" size="sm" className="relative">
              <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-300" />
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
        <Stories users={users} posts={posts} />

        {/* Feed Posts */}
        <div className="space-y-6 py-4">
          {postsLoading ? (
            <div className="space-y-4 px-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="w-24 h-4" />
                      <Skeleton className="w-16 h-3" />
                    </div>
                  </div>
                  <Skeleton className="w-full h-20" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Your feed is empty
              </h3>
              <p className="text-gray-500 dark:text-gray-200 mb-6 max-w-sm mx-auto">
                Start sharing your workouts, nutrition, and progress with the fitness community!
              </p>
              <Button 
                className="bg-gradient-to-r from-fit-green to-emerald-500 hover:from-fit-green/90 hover:to-emerald-500/90 text-white px-6 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Share Your Fitness Journey
              </Button>
            </div>
          ) : (
            <div className="px-4 space-y-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-4 z-40">
        <Button 
          className="w-16 h-16 bg-gradient-to-r from-fit-green to-emerald-500 hover:from-fit-green/90 hover:to-emerald-500/90 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-7 h-7" />
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
