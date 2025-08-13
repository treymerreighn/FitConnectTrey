import { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "./user-avatar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CURRENT_USER_ID } from "@/lib/constants";
import type { Post, User } from "@shared/schema";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  
  const { data: user } = useQuery<User>({
    queryKey: [`/api/users/${post.userId}`],
  });

  // Debug logging for user data
  console.log("Post user ID:", post.userId);
  console.log("User data for post:", user);

  // If user data is missing, don't render the post
  if (!user) {
    return null;
  }

  const { data: comments = [] } = useQuery({
    queryKey: [`/api/posts/${post.id}/comments`],
    enabled: showComments,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const isLiked = post.likes.includes(CURRENT_USER_ID);
      const endpoint = isLiked ? "unlike" : "like";
      return apiRequest("POST", `/api/posts/${post.id}/${endpoint}`, { userId: CURRENT_USER_ID });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const isLiked = post.likes.includes(CURRENT_USER_ID);
  const likesCount = post.likes.length;
  const commentsCount = post.comments.length;

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
            <UserAvatar
              src={user?.avatar}
              name={user?.name}
              alt={`${user?.name}'s avatar`}
            />
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">@{user?.username} • {formatTimeAgo(post.createdAt)}</p>
            </div>
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
          <img 
            src={post.images[0]} 
            alt="Post content" 
            className="w-full h-80 object-cover"
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
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto text-gray-600 hover:text-gray-800"
          >
            <Bookmark className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Post Details */}
        {(post.workoutData || post.nutritionData || post.progressData) && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mt-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">
              {post.type === "workout" && "Workout Details"}
              {post.type === "nutrition" && "Nutrition Facts"}
              {post.type === "progress" && "Progress Stats"}
            </h4>
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
                      <span className="text-gray-600 dark:text-gray-400">Sets:</span>
                      <span className="font-medium ml-1">{post.workoutData.sets}</span>
                    </div>
                  )}
                  {post.workoutData.reps && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Reps:</span>
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
      </CardContent>
    </Card>
  );
}
