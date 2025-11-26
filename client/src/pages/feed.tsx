import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, MessageCircle, Dumbbell, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import TopHeader from "@/components/TopHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PostCard } from "@/components/ui/post-card";
import { CreatePostModal } from "@/components/ui/create-post-modal";
import { Stories } from "@/components/stories";
import type { Post, User } from "@shared/schema";

export default function Feed() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [, setLocation] = useLocation();
  
  const { data: posts = [], isLoading: postsLoading, error: postsError } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    enabled: true,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  const { data: users = [], error: usersError } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: true,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });


  const getActiveUsers = () => {
    // Show users who have posted recently (for stories)
    const recentPosters = posts.slice(0, 4).map(post => 
      users.find(user => user.id === post.userId)
    ).filter(Boolean) as User[];
    
    // Add current user at the beginning
    const currentUser = users.find(user => user.id === "44595091");
    if (currentUser) {
      return [currentUser, ...recentPosters.filter(user => user.id !== currentUser.id)];
    }
    return recentPosters;
  };

  const activeUsers = getActiveUsers();

  if (postsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <TopHeader />

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
      <TopHeader showSearch={true} />

      {/* Main Content */}
      <main className="pt-16 pb-20">
        {/* Stories Row */}
        <Stories users={users} />

        {/* Feed Posts */}
        <div className="space-y-4 py-4">
          {posts.length === 0 ? (
            <div className="text-center py-8 px-4">
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
