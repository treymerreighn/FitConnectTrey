import { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Play, Save, Copy } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "./user-avatar";
import { Link } from "@/components/ui/link";
import { OptimizedImage } from "../OptimizedImage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CURRENT_USER_ID } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { projectWorkoutForUser } from "@/lib/workoutProjection";
import type { Post, User, Comment } from "@shared/schema";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // ALL HOOKS MUST COME FIRST - NO CONDITIONAL LOGIC ABOVE HOOKS
  const { data: user } = useQuery<User>({
    queryKey: [`/api/users/${post.userId}`],
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: [`/api/posts/${post.id}/comments`],
    enabled: showComments,
  });
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: [`/api/users`],
    staleTime: 1000 * 60 * 5,
  });
  const usersMap = Object.fromEntries((allUsers || []).map(u => [u.id, u]));

  const [commentText, setCommentText] = useState("");

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      // Use apiRequest directly; server expects { userId, postId, content }
      return apiRequest("POST", `/api/posts/${post.id}/comments`, { userId: CURRENT_USER_ID, content });
    },
    onMutate: async (content: string) => {
      await queryClient.cancelQueries({ queryKey: [`/api/posts/${post.id}/comments`] });
      const previous = queryClient.getQueryData([`/api/posts/${post.id}/comments`]);
      // Optimistically add a local comment
      const optimistic = {
        id: `temp-${Date.now()}`,
        userId: CURRENT_USER_ID,
        postId: post.id,
        content,
        createdAt: new Date().toISOString(),
      } as any;
      queryClient.setQueryData([`/api/posts/${post.id}/comments`], (old: any) => {
        return old ? [optimistic, ...old] : [optimistic];
      });
      // Also update posts list comment counts
      queryClient.setQueryData(["/api/posts"], (old: any) => {
        if (!old) return old;
        return old.map((p: any) => p.id === post.id ? { ...p, comments: [...(p.comments || []), optimistic.id] } : p);
      });
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData([`/api/posts/${post.id}/comments`], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", `/api/posts/${post.id}/comments`] });
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/posts/${post.id}/comments/${id}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", `/api/posts/${post.id}/comments`] });
    }
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const isLiked = post.likes.includes(CURRENT_USER_ID);
      const endpoint = isLiked ? "unlike" : "like";
      return apiRequest("POST", `/api/posts/${post.id}/${endpoint}`, { userId: CURRENT_USER_ID });
    },
    onMutate: async () => {
      // Optimistic update for instant feedback
      await queryClient.cancelQueries({ queryKey: ["/api/posts"] });
      
      const previousPosts = queryClient.getQueryData(["/api/posts"]);
      
      queryClient.setQueryData(["/api/posts"], (old: any) => {
        if (!old) return old;
        return old.map((p: any) => {
          if (p.id === post.id) {
            const isLiked = p.likes.includes(CURRENT_USER_ID);
            return {
              ...p,
              likes: isLiked 
                ? p.likes.filter((id: string) => id !== CURRENT_USER_ID)
                : [...p.likes, CURRENT_USER_ID]
            };
          }
          return p;
        });
      });
      
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousPosts) {
        queryClient.setQueryData(["/api/posts"], context.previousPosts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });


  // If user data is missing, show loading state instead of hiding post
  if (!user) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full animate-pulse" />
            <div className="flex-1">
              <div className="w-24 h-4 bg-gray-300 rounded animate-pulse mb-1" />
              <div className="w-16 h-3 bg-gray-300 rounded animate-pulse" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full h-4 bg-gray-300 rounded animate-pulse mb-2" />
          <div className="w-3/4 h-4 bg-gray-300 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const isLiked = post.likes.includes(CURRENT_USER_ID);
  const likesCount = post.likes.length;
  const commentsCount = post.comments.length;

  // Handle starting a workout from a post
  const handleStartWorkout = async () => {
    if (!post.workoutData?.exercises) {
      toast({
        title: "Cannot Start Workout",
        description: "This workout doesn't have exercise details",
        variant: "destructive",
      });
      return;
    }

    const plan = await projectWorkoutForUser({
      workoutName: post.workoutData.workoutType || 'Shared Workout',
      exercises: post.workoutData.exercises.map((ex: any) => ({
        name: ex.name || ex.exerciseName,
        exerciseId: ex.exerciseId || ex.id,
        sets: Array.isArray(ex.sets) ? ex.sets : undefined,
      }))
    });

    const exerciseIds = plan.exercises.map(e => e.id).join(',');
    const planParam = encodeURIComponent(JSON.stringify(plan));
    // Route to builder pre-filled so user can review/adjust, then Start
    setLocation(`/build-workout?from=post&exercises=${exerciseIds}&plan=${planParam}`);
  };

  // Handle saving a workout as a template
  const handleSaveWorkout = async () => {
    if (!post.workoutData) return;
    try {
      await apiRequest("POST", "/api/saved-workouts", {
        templateId: post.id,
        sourceType: "post",
        dataSnapshot: {
          name: post.workoutData.workoutType || 'Saved Workout',
          workoutData: post.workoutData,
          author: user?.username,
        }
      });
      setIsSaved(true);
      queryClient.invalidateQueries({ queryKey: ["/api/saved-workouts"] });
      toast({
        title: "Workout Saved! 💪",
        description: "Check it in your Saved Workouts collection",
      });
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || "Couldn't save workout", variant: "destructive" });
    }
  };

  // Handle sharing a workout
  const handleShareWorkout = async () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    const shareText = `Check out this ${post.workoutData?.workoutType || 'workout'} by @${user?.username} on FitConnect!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.workoutData?.workoutType || 'Workout',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast({
        title: "Link Copied!",
        description: "Workout link copied to clipboard",
      });
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const getPostTypeConfig = (type: string) => {
    switch (type) {
      case "workout":
        return { 
          icon: "🏋️", 
          label: "Workout", 
          color: "bg-fit-green",
          textColor: "text-fit-green"
        };
      case "nutrition":
        return { 
          icon: "🍎", 
          label: "Nutrition", 
          color: "bg-fit-blue",
          textColor: "text-fit-blue"
        };
      case "progress":
        return { 
          icon: "📈", 
          label: "Progress", 
          color: "bg-fit-gold",
          textColor: "text-fit-gold"
        };
      default:
        return { 
          icon: "📝", 
          label: "Post", 
          color: "bg-gray-500",
          textColor: "text-gray-500"
        };
    }
  };

  const typeConfig = getPostTypeConfig(post.type);

  return (
    <Card className="w-full border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/profile/${user?.id}`} asChild>
              <div className="flex items-center space-x-3 cursor-pointer">
                <UserAvatar
                  src={user?.avatar}
                  name={user?.name}
                  alt={`${user?.name}'s avatar`}
                />
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.location ? `${user.location} • ` : ''}{formatTimeAgo(post.createdAt)}
                  </p>
                </div>
              </div>
            </Link>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Badge className={`${typeConfig.color} text-white text-xs px-2 py-1`}>
              <span className="mr-1">{typeConfig.icon}</span>
              {typeConfig.label}
            </Badge>
            {post.workoutData && (
              <span className={`text-sm font-medium ${typeConfig.textColor}`}>
                {post.workoutData.workoutType}
              </span>
            )}
            {post.nutritionData && (
              <span className={`text-sm font-medium ${typeConfig.textColor}`}>
                {post.nutritionData.mealType}
              </span>
            )}
            {post.progressData && (
              <span className={`text-sm font-medium ${typeConfig.textColor}`}>
                {post.progressData.progressType}
              </span>
            )}
          </div>
          <p className="text-sm text-[#f0f0f0]">{post.caption}</p>
        </div>
      </CardHeader>
      {post.images && post.images.length > 0 && (
        <div className="px-0">
          <OptimizedImage 
            src={post.images[0]} 
            alt="Post content" 
            width={800}
            height={450}
            className="w-full aspect-video rounded-md overflow-hidden"
            placeholder="blur"
          />
        </div>
      )}
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className={`p-0 h-auto ${isLiked ? 'text-red-500' : 'text-gray-600'} hover:text-red-500`}
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
            >
              <Heart className={`h-5 w-5 mr-1 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">{likesCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto text-gray-600 hover:text-gray-800"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-5 w-5 mr-1" />
              <span>{commentsCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto text-gray-600 hover:text-gray-800"
              onClick={handleShareWorkout}
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`p-0 h-auto ${isSaved ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-600`}
            onClick={handleSaveWorkout}
          >
            <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
          </Button>
        </div>

        {/* Workout Action Buttons */}
        {post.workoutData && (
          <div className="flex gap-2 mt-3">
            <Button
              onClick={handleStartWorkout}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              Start This Workout
            </Button>
            <Button
              onClick={handleSaveWorkout}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-600/10"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        )}
        
  {/* Post Details */}
        {(post.workoutData || post.nutritionData || post.progressData) && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mt-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">
              {post.type === "workout" && "Workout Details"}
              {post.type === "nutrition" && "Nutrition Facts"}
              {post.type === "progress" && "Progress Stats"}
            </h4>
            
            {/* Exercise List for Workouts */}
            {post.workoutData?.exercises && post.workoutData.exercises.length > 0 && (
              <div className="mb-3">
                <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Exercises:</h5>
                <div className="space-y-1">
                  {post.workoutData.exercises.slice(0, 5).map((exercise: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-white dark:bg-gray-900 rounded px-2 py-1">
                      <span className="font-medium">{exercise.name || exercise.exerciseName}</span>
                      {exercise.sets && (
                        <span className="text-gray-500">
                          {Array.isArray(exercise.sets) 
                            ? `${exercise.sets.length} sets` 
                            : `${exercise.sets} sets`}
                          {exercise.sets[0]?.reps && ` × ${exercise.sets[0].reps} reps`}
                        </span>
                      )}
                    </div>
                  ))}
                  {post.workoutData.exercises.length > 5 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      +{post.workoutData.exercises.length - 5} more exercises
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              {post.workoutData && (
                <>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="font-medium ml-1">{post.workoutData.duration} min</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Calories:</span>
                    <span className="font-medium ml-1">{post.workoutData.calories}</span>
                  </div>
                  {post.workoutData.sets && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Total Sets:</span>
                      <span className="font-medium ml-1">{post.workoutData.sets}</span>
                    </div>
                  )}
                  {post.workoutData.reps && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Exercises:</span>
                      <span className="font-medium ml-1">{post.workoutData.reps}</span>
                    </div>
                  )}
                  {post.workoutData.intervals && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Intervals:</span>
                      <span className="font-medium ml-1">{post.workoutData.intervals}</span>
                    </div>
                  )}
                  {post.workoutData.rest && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Rest:</span>
                      <span className="font-medium ml-1">{post.workoutData.rest}</span>
                    </div>
                  )}
                </>
              )}
              
              {post.nutritionData && (
                <>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Calories:</span>
                    <span className="font-medium ml-1">{post.nutritionData.calories}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Protein:</span>
                    <span className="font-medium ml-1">{post.nutritionData.protein}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Carbs:</span>
                    <span className="font-medium ml-1">{post.nutritionData.carbs}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Fat:</span>
                    <span className="font-medium ml-1">{post.nutritionData.fat}g</span>
                  </div>
                </>
              )}
              
              {post.progressData && (
                <>
                  {post.progressData.weightLost && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Weight Lost:</span>
                      <span className="font-medium ml-1 text-fit-green">{post.progressData.weightLost}</span>
                    </div>
                  )}
                  {post.progressData.bodyFat && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Body Fat:</span>
                      <span className="font-medium ml-1 text-fit-green">{post.progressData.bodyFat}</span>
                    </div>
                  )}
                  {post.progressData.muscleGain && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Muscle Gain:</span>
                      <span className="font-medium ml-1 text-fit-green">{post.progressData.muscleGain}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Time Frame:</span>
                    <span className="font-medium ml-1">{post.progressData.duration}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        {/* Comments Section */}
        {showComments && (
          <div className="mt-4">
            <div className="space-y-3">
              {/* New comment input */}
              <div className="flex items-start gap-2">
                <UserAvatar src={user?.avatar} name={user?.name} alt="You" />
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full bg-gray-100 dark:bg-gray-800 rounded p-2 text-sm"
                    rows={2}
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      onClick={() => {
                        if (!commentText.trim()) return;
                        createCommentMutation.mutate(commentText.trim());
                        setCommentText("");
                      }}
                      disabled={createCommentMutation.isPending}
                    >
                      Comment
                    </Button>
                  </div>
                </div>
              </div>

              {/* Existing comments */}
              <div className="space-y-2">
                {comments.length === 0 ? (
                  <div className="text-sm text-gray-500">No comments yet.</div>
                ) : (
                  comments.map((c: any) => (
                    <div key={c.id} className="p-2 bg-gray-50 dark:bg-gray-900 rounded">
                      <div className="text-xs text-gray-500">{c.userId} • {new Date(c.createdAt).toLocaleString()}</div>
                      <div className="mt-1 text-sm">{c.content}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
