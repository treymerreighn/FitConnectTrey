import { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
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

  const { data: comments = [] } = useQuery({
    queryKey: [`/api/posts/${post.id}/comments`],
    enabled: showComments,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const isLiked = post.likes.includes(CURRENT_USER_ID);
      if (isLiked) {
        return api.unlikePost(post.id, CURRENT_USER_ID);
      } else {
        return api.likePost(post.id, CURRENT_USER_ID);
      }
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
    <Card className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <UserAvatar
              src={user?.avatar}
              name={user?.name}
              alt={`${user?.name}'s avatar`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">
                  {user?.name || "Loading..."}
                </h3>
                <Badge className={`${typeConfig.color} text-white text-xs px-2 py-1 flex-shrink-0`}>
                  <span className="mr-1">{typeConfig.icon}</span>
                  {typeConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-100 font-medium">
                {formatTimeAgo(post.createdAt)}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
          </Button>
        </div>
        
        <div className="mt-3">
          {post.caption && (
            <p className="text-gray-900 dark:text-white text-base leading-relaxed mb-3 font-medium">
              {post.caption}
            </p>
          )}
          
          {/* Workout Details */}
          {post.workoutData && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {post.workoutData.workoutType}
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {post.workoutData.duration} min
                </span>
              </div>
              {post.workoutData.exercises && post.workoutData.exercises.length > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  {post.workoutData.exercises.length} exercises
                </div>
              )}
            </div>
          )}
          
          {/* Nutrition Details */}
          {post.nutritionData && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {post.nutritionData.mealType}
                </h4>
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {post.nutritionData.calories} cal
                </span>
              </div>
            </div>
          )}
          
          {/* Progress Details */}
          {post.progressData && (
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                {post.progressData.progressType}
              </h4>
              <div className="text-xs text-orange-600 dark:text-orange-400">
                Progress update
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      
      {post.images && post.images.length > 0 && (
        <div className="px-0">
          {post.images.length === 1 ? (
            <img 
              src={post.images[0]} 
              alt="Post content" 
              className="w-full h-80 object-cover"
            />
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {post.images.slice(0, 4).map((image, index) => (
                <div key={index} className="relative">
                  <img 
                    src={image} 
                    alt={`Post content ${index + 1}`} 
                    className="w-full h-40 object-cover"
                  />
                  {index === 3 && post.images.length > 4 && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                      <span className="text-white font-semibold">+{post.images.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className={`p-0 h-auto ${isLiked ? 'text-red-500' : 'text-gray-600 dark:text-white'} hover:text-red-500 font-medium`}
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
            >
              <Heart className={`h-5 w-5 mr-1 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">{likesCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto text-gray-600 dark:text-white hover:text-gray-800 dark:hover:text-gray-200 font-medium"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-5 w-5 mr-1" />
              <span>{commentsCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto text-gray-600 dark:text-white hover:text-gray-800 dark:hover:text-gray-200 font-medium"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto text-gray-600 dark:text-white hover:text-gray-800 dark:hover:text-gray-200 font-medium"
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
                </>
              )}
            </div>
            
            {/* Detailed Exercise Logging */}
            {post.workoutData?.exercises && post.workoutData.exercises.length > 0 && (
              <div className="mt-4 space-y-3">
                <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Exercises</h5>
                {post.workoutData.exercises.map((exercise, index) => (
                  <div key={index} className="border-l-2 border-fit-green pl-3">
                    <h6 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{exercise.name}</h6>
                    <div className="grid grid-cols-4 gap-2 mt-2 text-xs">
                      {exercise.sets.map((set, setIndex) => (
                        <div key={setIndex} className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
                          <div className="text-center">
                            <div className="font-medium">{set.reps} reps</div>
                            {set.weight && <div className="text-gray-600 dark:text-gray-400">{set.weight} lbs</div>}
                            {set.duration && <div className="text-gray-600 dark:text-gray-400">{set.duration}s</div>}
                            {set.distance && <div className="text-gray-600 dark:text-gray-400">{set.distance}m</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {exercise.notes && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">{exercise.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Legacy workout data display */}
            {post.workoutData && !post.workoutData.exercises && (
              <div className="grid grid-cols-2 gap-3 text-sm mt-3">
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
              </div>
            )}
            
            {post.nutritionData && (
              <div className="grid grid-cols-2 gap-3 text-sm">
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
              </div>
            )}
            
            {post.progressData && (
              <div className="grid grid-cols-2 gap-3 text-sm">
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
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
