import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dumbbell, Clock, Flame, Target, Plus, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useLocation } from "wouter";
import type { Post } from "@shared/schema";

export default function Workouts() {
  const [location, setLocation] = useLocation();
  const [trendingPeriod, setTrendingPeriod] = useState(24);
  
  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  const { data: trendingWorkouts = [], isLoading: loadingTrending } = useQuery<Post[]>({
    queryKey: ["/api/workouts/trending", trendingPeriod],
    queryFn: () => api.getTrendingWorkouts(trendingPeriod),
  });

  const workoutPosts = posts.filter(post => post.type === "workout");

  const workoutStats = {
    totalWorkouts: workoutPosts.length,
    totalCalories: workoutPosts.reduce((sum, post) => sum + (post.workoutData?.calories || 0), 0),
    totalMinutes: workoutPosts.reduce((sum, post) => sum + (post.workoutData?.duration || 0), 0),
    avgCaloriesPerWorkout: workoutPosts.length > 0 ? Math.round(workoutPosts.reduce((sum, post) => sum + (post.workoutData?.calories || 0), 0) / workoutPosts.length) : 0,
  };

  const workoutTypes = workoutPosts.reduce((acc, post) => {
    const type = post.workoutData?.workoutType || "Other";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <div className="px-4 py-6">
          <div className="flex items-center space-x-3 mb-6">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-32 h-8" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-fit-green rounded-lg flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workouts</h1>
          </div>
          <Button 
            onClick={() => setLocation("/log-workout")}
            className="bg-fit-green hover:bg-fit-green/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Log Workout
          </Button>
        </div>

        {/* Workout Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-fit-green/10 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-fit-green" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{workoutStats.totalWorkouts}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Workouts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <Flame className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{workoutStats.totalCalories}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Calories Burned</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{workoutStats.totalMinutes}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Minutes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{workoutStats.avgCaloriesPerWorkout}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Calories</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trending Workouts */}
        <Card className="border-0 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Trending Workouts</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={trendingPeriod === 24 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTrendingPeriod(24)}
                  className={trendingPeriod === 24 ? "bg-fit-green hover:bg-fit-green/90" : ""}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  24h
                </Button>
                <Button
                  variant={trendingPeriod === 168 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTrendingPeriod(168)}
                  className={trendingPeriod === 168 ? "bg-fit-green hover:bg-fit-green/90" : ""}
                >
                  <Flame className="h-3 w-3 mr-1" />
                  7d
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTrending ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 rounded" />
                ))}
              </div>
            ) : trendingWorkouts.length > 0 ? (
              <div className="space-y-3">
                {trendingWorkouts.slice(0, 5).map((workout, index) => (
                  <div key={workout.id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-shrink-0">
                      <Badge className="bg-fit-gold text-white">
                        #{index + 1}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {workout.workoutData?.workoutType || "Workout"}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {workout.likes.length} likes • {workout.comments.length} comments
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {workout.workoutData?.duration || 0} min
                      </div>
                      <div className="text-xs text-gray-500">
                        {workout.workoutData?.calories || 0} cal
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No trending workouts in the last {trendingPeriod === 24 ? '24 hours' : '7 days'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workout Types */}
        {Object.keys(workoutTypes).length > 0 && (
          <Card className="border-0 shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Workout Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(workoutTypes).map(([type, count]) => (
                  <Badge key={type} variant="secondary" className="bg-fit-green/10 text-fit-green">
                    {type} ({count})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Workouts */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Workouts</h2>
          
          {workoutPosts.length === 0 ? (
            <div className="text-center py-8">
              <Dumbbell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No workouts shared yet</p>
            </div>
          ) : (
            workoutPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
