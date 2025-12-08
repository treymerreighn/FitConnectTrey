import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserAvatar } from "@/components/ui/user-avatar";
import { CURRENT_USER_ID } from "@/lib/constants";
import { api } from "@/lib/api";
import { Plus, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { User, Story } from "@shared/schema";

interface StoriesProps {
  users: User[];
}

export function Stories({ users }: StoriesProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  
  // Touch gesture state for swipe-down
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchOffset, setTouchOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  const { data: stories = [], isLoading, error } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
    // Use default queryFn from queryClient which will fetch the queryKey[0] URL
  });

  console.log('📊 [Stories] Component state:', { storiesCount: stories.length, isLoading, error, users: users.length });

  // Early return if error
  if (error) {
    console.error('❌ [Stories] Error loading stories:', error);
    return <div className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 py-6 px-4">
      <p className="text-sm text-red-500">Error loading stories</p>
    </div>;
  }

  const createStoryMutation = useMutation({
    mutationFn: async (data: { image: string; caption: string }) => {
      console.log('🔄 Mutation function called with:', data);
      const result = await api.createStory({
        userId: CURRENT_USER_ID,
        image: data.image,
        caption: data.caption,
      });
      console.log('✅ Mutation successful:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ onSuccess called with:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      setShowCreateDialog(false);
      setSelectedImage(null);
      setPreviewUrl("");
      setCaption("");
    },
    onError: (error: any) => {
      console.error('❌ Mutation error:', error);
      console.error('❌ Error response:', error.response?.data);
    }
  });

  const viewStoryMutation = useMutation({
    mutationFn: (storyId: string) => api.viewStory(storyId, CURRENT_USER_ID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setShowCreateDialog(true);
    }
  };

  const handleCreateStory = async () => {
    if (!selectedImage) {
      console.error('No image selected');
      return;
    }

    try {
      console.log('🚀 Starting story creation...');
      console.log('📷 Selected image:', selectedImage.name, selectedImage.type, selectedImage.size);
      
      console.log('⬆️ Uploading image...');
      const uploadResult = await api.uploadImage(selectedImage);
      console.log('✅ Image uploaded successfully:', uploadResult);
      
      const imageUrl = uploadResult.url;
      console.log('📝 Creating story with data:', { 
        userId: CURRENT_USER_ID, 
        image: imageUrl, 
        caption 
      });
      const result = await createStoryMutation.mutateAsync({ image: imageUrl, caption });
      console.log('✅ Story created successfully:', result);
    } catch (error: any) {
      console.error("❌ Failed to create story:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      alert(`Failed to create story: ${error.message || 'Unknown error'}`);
    }
  };

  const handleStoryClick = (story: Story) => {
    setSelectedStory(story);
    viewStoryMutation.mutate(story.id);
  };

  const handleNextStory = () => {
    if (!selectedStory) return;
    const currentIndex = stories.findIndex(s => s.id === selectedStory.id);
    if (currentIndex < stories.length - 1) {
      const nextStory = stories[currentIndex + 1];
      setSelectedStory(nextStory);
      viewStoryMutation.mutate(nextStory.id);
    }
  };

  const handlePreviousStory = () => {
    if (!selectedStory) return;
    const currentIndex = stories.findIndex(s => s.id === selectedStory.id);
    if (currentIndex > 0) {
      const prevStory = stories[currentIndex - 1];
      setSelectedStory(prevStory);
      viewStoryMutation.mutate(prevStory.id);
    }
  };

  const handleStoryScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    
    // Click on left third goes back, right two-thirds goes forward
    if (clickX < width / 3) {
      handlePreviousStory();
    } else {
      handleNextStory();
    }
  };

  // Touch gesture handlers for swipe-down to exit
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    
    const currentY = e.touches[0].clientY;
    const offset = currentY - touchStart;
    
    // Only allow downward swipe (positive offset)
    if (offset > 0) {
      setTouchOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    if (touchOffset > 150) {
      // Swipe threshold exceeded, close the story
      setSelectedStory(null);
    }
    
    // Reset gesture state
    setTouchStart(null);
    setTouchOffset(0);
    setIsDragging(false);
  };

  // Group stories by user
  const storiesByUser = stories.reduce((acc, story) => {
    if (!acc[story.userId]) {
      acc[story.userId] = [];
    }
    acc[story.userId].push(story);
    return acc;
  }, {} as Record<string, Story[]>);

  // Check if user has viewed a story
  const hasViewedStory = (story: Story) => {
    return story.views.includes(CURRENT_USER_ID);
  };

  // Check if user has any unviewed stories
  const hasUnviewedStories = (userStories: Story[]) => {
    return userStories.some(story => !hasViewedStory(story));
  };

  // Get current user's stories
  const currentUserStories = storiesByUser[CURRENT_USER_ID] || [];
  const currentUserHasActiveStory = currentUserStories.length > 0;

  return (
    <>
      <div className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="px-4 py-1">
          <div className="flex items-center space-x-4 overflow-x-auto scrollbar-hide">
            {/* Current user's story button - shows ring if has active story */}
            <div className="flex-shrink-0 text-center">
              <button
                onClick={() => {
                  if (currentUserHasActiveStory) {
                    // View their own story first
                    handleStoryClick(currentUserStories[0]);
                  } else {
                    // Create new story
                    fileInputRef.current?.click();
                  }
                }}
                className="relative inline-block"
              >
                <div className={`w-16 h-16 rounded-full ${
                  currentUserHasActiveStory 
                    ? (hasUnviewedStories(currentUserStories) ? 'bg-red-500' : 'bg-gray-300 dark:bg-zinc-600')
                    : 'bg-gradient-to-tr from-gray-300 to-gray-400 dark:from-zinc-600 dark:to-zinc-700'
                } p-0.5 shadow-md`}>
                  <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 p-0.5 flex items-center justify-center">
                    <UserAvatar
                      src={users.find(u => u.id === CURRENT_USER_ID)?.avatar || ""}
                      name={users.find(u => u.id === CURRENT_USER_ID)?.name || ""}
                      className="w-full h-full border-0"
                      size="lg"
                    />
                  </div>
                </div>
                <div className="absolute bottom-3 right-0 bg-red-600 rounded-full p-0.5 border-2 border-white dark:border-zinc-900 shadow-sm">
                  <Plus className="w-2.5 h-2.5 text-white" />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 max-w-[64px] truncate">
                  Your Story
                </p>
              </button>
            </div>

            {/* Other users' stories - only show users with stories */}
            {Object.entries(storiesByUser)
              .filter(([userId]) => userId !== CURRENT_USER_ID)
              .sort(([userIdA, storiesA], [userIdB, storiesB]) => {
                // Sort by unviewed stories first (unviewed before viewed)
                const unviewedA = hasUnviewedStories(storiesA);
                const unviewedB = hasUnviewedStories(storiesB);
                
                if (unviewedA && !unviewedB) return -1; // A has unviewed, comes first
                if (!unviewedA && unviewedB) return 1;  // B has unviewed, comes first
                return 0; // Both viewed or both unviewed, keep original order
              })
              .map(([userId, userStories]) => {
                const user = users.find(u => u.id === userId);
                if (!user) return null;

                const unviewed = hasUnviewedStories(userStories);

                return (
                  <div key={userId} className="flex-shrink-0 text-center pt-1">
                    <button onClick={() => handleStoryClick(userStories[0])} className="relative">
                      <div className={`w-16 h-16 rounded-full shadow-md p-0.5 ${
                        unviewed ? 'bg-red-500' : 'bg-gray-300 dark:bg-zinc-600'
                      }`}>
                        <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 p-0.5">
                          <UserAvatar
                            src={user.avatar}
                            name={user.name}
                            className="w-full h-full border-0"
                            size="lg"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 max-w-[64px] truncate">
                        {user.name.split(" ")[0]}
                      </p>
                    </button>
                  </div>
                );
              })}
            
            {/* Empty state - only show if no stories at all (excluding current user) */}
            {Object.keys(storiesByUser).filter(id => id !== CURRENT_USER_ID).length === 0 && (
              <div className="flex-1 text-center py-4">
                <p className="text-gray-500 dark:text-gray-300 text-sm">
                  No stories yet. Be the first to share!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* Create Story Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg [&>button]:!right-4 [&>button]:!top-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Create Story</h3>

            {previewUrl && (
              <div className="relative aspect-[9/16] max-h-[500px] mx-auto bg-black rounded-lg overflow-hidden">
                <img src={previewUrl} alt="Story preview" className="w-full h-full object-contain" />
              </div>
            )}

            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="w-full px-4 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
            />

            <button
              onClick={handleCreateStory}
              disabled={!selectedImage || createStoryMutation.isPending}
              className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {createStoryMutation.isPending ? "Posting..." : "Post Story"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Story Viewer Dialog */}
      {selectedStory && (
        <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
          <DialogContent 
            className="!max-w-none w-screen h-screen p-0 bg-black m-0 rounded-none border-0 !translate-x-0 !translate-y-0 !left-0 !top-0 flex items-center justify-center focus:outline-none focus-visible:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 [&>button]:!absolute [&>button]:!right-4 [&>button]:!top-4 [&>button]:z-[60] [&>button]:!text-white [&>button]:!opacity-100 [&>button]:!bg-transparent [&>button]:hover:!opacity-100 [&>button]:focus:!ring-0 [&>button]:focus:!ring-offset-0 [&>button]:focus-visible:!ring-0 [&>button]:!rounded-full [&>button]:!p-1"
            style={{ outline: 'none', boxShadow: 'none' }}
          >
            <div 
              className="relative w-full h-full flex items-center justify-center cursor-pointer outline-none focus:outline-none transition-transform" 
              onClick={handleStoryScreenClick}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                transform: isDragging ? `translateY(${touchOffset}px)` : 'translateY(0)',
                opacity: isDragging ? Math.max(0.5, 1 - touchOffset / 300) : 1,
                transition: isDragging ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out'
              }}
            >
              {/* Story image - properly scaled and centered */}
              <img 
                src={selectedStory.image} 
                alt="Story" 
                className="max-w-full max-h-full object-contain pointer-events-none"
                style={{
                  maxHeight: 'calc(100vh - 120px)', // Leave room for header/footer
                  maxWidth: 'calc(100vw - 32px)',
                }}
              />
              
              {/* Story header */}
              <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
                <div className="flex items-center space-x-3">
                  <UserAvatar
                    src={users.find(u => u.id === selectedStory.userId)?.avatar || ""}
                    name={users.find(u => u.id === selectedStory.userId)?.name || ""}
                    size="sm"
                  />
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {users.find(u => u.id === selectedStory.userId)?.name}
                    </p>
                    <p className="text-white/70 text-xs">
                      {new Date(selectedStory.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Caption */}
              {selectedStory.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-white text-center">{selectedStory.caption}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
