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

  const { data: stories = [], isLoading, error } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
    // Use default queryFn from queryClient which will fetch the queryKey[0] URL
  });

  console.log('📊 [Stories] Component state:', { storiesCount: stories.length, isLoading, error, users: users.length });

  // Early return if error
  if (error) {
    console.error('❌ [Stories] Error loading stories:', error);
    return <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-6 px-4">
      <p className="text-sm text-red-500">Error loading stories</p>
    </div>;
  }

  const createStoryMutation = useMutation({
    mutationFn: async (data: { image: string; caption: string }) => {
      return await api.createStory({
        userId: CURRENT_USER_ID,
        image: data.image,
        caption: data.caption,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      setShowCreateDialog(false);
      setSelectedImage(null);
      setPreviewUrl("");
      setCaption("");
    },
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
    if (!selectedImage) return;

    try {
      const imageUrl = await api.uploadImage(selectedImage);
      await createStoryMutation.mutateAsync({ image: imageUrl, caption });
    } catch (error) {
      console.error("Failed to create story:", error);
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

  // Group stories by user
  const storiesByUser = stories.reduce((acc, story) => {
    if (!acc[story.userId]) {
      acc[story.userId] = [];
    }
    acc[story.userId].push(story);
    return acc;
  }, {} as Record<string, Story[]>);

  const currentUserHasStory = storiesByUser[CURRENT_USER_ID]?.length > 0;

  // Check if user has viewed a story
  const hasViewedStory = (story: Story) => {
    return story.views.includes(CURRENT_USER_ID);
  };

  // Check if user has any unviewed stories
  const hasUnviewedStories = (userStories: Story[]) => {
    return userStories.some(story => !hasViewedStory(story));
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-1">
          <div className="flex items-center space-x-4 overflow-x-auto scrollbar-hide">
            {/* Current user's add story button */}
            <div className="flex-shrink-0 text-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="relative inline-block"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 p-0.5 shadow-md">
                  <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-0.5 flex items-center justify-center">
                    <UserAvatar
                      src={users.find(u => u.id === CURRENT_USER_ID)?.avatar || ""}
                      name={users.find(u => u.id === CURRENT_USER_ID)?.name || ""}
                      className="w-full h-full border-0"
                      size="lg"
                    />
                  </div>
                </div>
                <div className="absolute bottom-3 right-0 bg-fit-green rounded-full p-0.5 border-2 border-white dark:border-gray-800 shadow-sm">
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
              .map(([userId, userStories]) => {
                const user = users.find(u => u.id === userId);
                if (!user) return null;

                const unviewed = hasUnviewedStories(userStories);

                return (
                  <div key={userId} className="flex-shrink-0 text-center pt-1">
                    <button onClick={() => handleStoryClick(userStories[0])} className="relative">
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-tr from-fit-green to-fit-blue p-0.5 shadow-md ${
                        unviewed ? 'ring-2 ring-fit-green ring-offset-1 dark:ring-offset-gray-800 animate-pulse' : ''
                      }`}>
                        <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-0.5">
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
        <DialogContent className="max-w-lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create Story</h3>
              <button onClick={() => setShowCreateDialog(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

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
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />

            <button
              onClick={handleCreateStory}
              disabled={!selectedImage || createStoryMutation.isPending}
              className="w-full py-2 bg-fit-green text-white rounded-lg hover:bg-fit-green/90 disabled:opacity-50"
            >
              {createStoryMutation.isPending ? "Posting..." : "Post Story"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Story Viewer Dialog */}
      {selectedStory && (
        <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
          <DialogContent className="max-w-full w-screen h-screen p-0 bg-black m-0 rounded-none">
            <div className="relative w-full h-full cursor-pointer" onClick={handleStoryScreenClick}>
              <img src={selectedStory.image} alt="Story" className="w-full h-full object-cover pointer-events-none" />
              
              {/* Story header */}
              <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
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
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                  <p className="text-white text-center">{selectedStory.caption}</p>
                </div>
              )}

              {/* Close button */}
              <button
                onClick={() => setSelectedStory(null)}
                className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
