import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dumbbell, Clock, Flame, Target, Plus, TrendingUp, Search, Filter, Star, BookOpen, Play, Users, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PostCard } from "@/components/ui/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useLocation } from "wouter";
import type { Post, Exercise } from "@shared/schema";

export default function Workouts() {
  const [location, setLocation] = useLocation();
  const [trendingPeriod, setTrendingPeriod] = useState(24);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Exercise library query - using default queryFn pattern
  const buildExercisesUrl = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (selectedCategory && selectedCategory !== "all") params.append("category", selectedCategory);
    if (selectedMuscleGroup && selectedMuscleGroup !== "all") params.append("muscleGroup", selectedMuscleGroup);
    
    const queryString = params.toString();
    return `/api/exercises${queryString ? `?${queryString}` : ""}`;
  };

  const { data: exercises, isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: [buildExercisesUrl()],
  });

  // Workout posts query - standardized to use default queryFn
  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  const { data: trendingWorkouts = [], isLoading: trendingLoading } = useQuery<Post[]>({
    queryKey: [`/api/posts/trending?hours=${trendingPeriod}`],
  });

  const workoutPosts = posts.filter((post: Post) => post.type === "workout");

  const muscleGroups = [
    "chest", "back", "shoulders", "biceps", "triceps", "quadriceps", 
    "hamstrings", "glutes", "calves", "abs", "obliques", "lats", "traps", "delts"
  ];

  const categories = ["strength", "cardio", "flexibility", "sports", "functional"];

  const startWorkout = () => {
    setLocation("/exercise-library");
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "advanced": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-2xl">
              <Dumbbell className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Exercise Library & Workouts
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Explore our comprehensive exercise database with detailed instructions, or discover trending workout routines from the community.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap justify-center gap-4">
          <Button 
            onClick={() => setLocation("/build-workout")}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg font-semibold"
          >
            <Target className="h-6 w-6 mr-2" />
            Build Workout
          </Button>
          <Button 
            onClick={startWorkout}
            size="lg"
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg font-semibold"
          >
            <Play className="h-6 w-6 mr-2" />
            Start Workout
          </Button>
          <Button 
            onClick={() => setLocation("/log-workout")}
            variant="outline"
            size="lg"
            className="px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-2" />
            Log Workout
          </Button>

        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="exercises" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="exercises" className="text-lg py-3">
              <BookOpen className="h-5 w-5 mr-2" />
              Exercise Library
            </TabsTrigger>
            <TabsTrigger value="community" className="text-lg py-3">
              <Users className="h-5 w-5 mr-2" />
              Community Workouts
            </TabsTrigger>
          </TabsList>

          {/* Exercise Library Tab */}
          <TabsContent value="exercises" className="space-y-6">
            {/* Search and Filter Controls */}
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search exercises by name, muscle group, or keyword..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="exercise-search-input"
                      />
                    </div>
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full lg:w-[180px]" data-testid="category-filter">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
                    <SelectTrigger className="w-full lg:w-[180px]" data-testid="muscle-group-filter">
                      <SelectValue placeholder="Muscle Group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Muscles</SelectItem>
                      {muscleGroups.map(muscle => (
                        <SelectItem key={muscle} value={muscle}>
                          {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Exercise Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exercisesLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <div className="flex gap-2 mb-4">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : exercises && exercises.length > 0 ? (
                exercises.map((exercise) => (
                  <Card key={exercise.id} className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:scale-[1.02]">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{exercise.name}</CardTitle>
                        <Badge className={`${getDifficultyColor(exercise.difficulty)} font-medium`}>
                          {exercise.difficulty}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {exercise.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {exercise.muscleGroups.slice(0, 3).map((muscle) => (
                          <Badge key={muscle} variant="secondary" className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors">
                            {muscle}
                          </Badge>
                        ))}
                        {exercise.muscleGroups.length > 3 && (
                          <Badge variant="secondary" className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                            +{exercise.muscleGroups.length - 3} more
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Target className="h-4 w-4 text-blue-500" />
                          <span className="capitalize font-medium">{exercise.category}</span>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Quick View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Dumbbell className="h-5 w-5" />
                                {exercise.name}
                              </DialogTitle>
                              <DialogDescription>
                                {exercise.description}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6">
                              <div className="flex flex-wrap gap-2">
                                <Badge className={getDifficultyColor(exercise.difficulty)}>
                                  {exercise.difficulty}
                                </Badge>
                                <Badge variant="outline">{exercise.category}</Badge>
                                {exercise.muscleGroups.map((muscle) => (
                                  <Badge key={muscle} variant="secondary">{muscle}</Badge>
                                ))}
                              </div>

                              {exercise.instructions.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    Instructions
                                  </h4>
                                  <ol className="space-y-2">
                                    {exercise.instructions.map((instruction, index) => (
                                      <li key={index} className="flex gap-3">
                                        <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                                          {index + 1}
                                        </span>
                                        <span className="text-sm">{instruction}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}

                              {exercise.tips.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <Star className="h-4 w-4" />
                                    Tips
                                  </h4>
                                  <ul className="space-y-1">
                                    {exercise.tips.map((tip, index) => (
                                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                                        • {tip}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}



                              {exercise.variations.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2">Variations</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {exercise.variations.map((variation, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {variation}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {exercise.equipment.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2">Equipment Needed</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {exercise.equipment.map((item, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {item}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Dumbbell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    No exercises found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    Try adjusting your search criteria or browse all exercises.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Community Workouts Tab */}
          <TabsContent value="community" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                    <Flame className="h-5 w-5" />
                    Total Workouts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-800 dark:text-orange-200">
                    {workoutPosts.length}
                  </div>
                  <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                    Shared by community
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Clock className="h-5 w-5" />
                    Avg Duration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-800 dark:text-green-200">45m</div>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Per workout session
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Target className="h-5 w-5" />
                    Active Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-800 dark:text-purple-200">1.2k</div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                    This week
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Trending Workouts */}
            <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <TrendingUp className="h-6 w-6 text-blue-500" />
                    Trending Workouts
                  </CardTitle>
                  <Select value={trendingPeriod.toString()} onValueChange={(value) => setTrendingPeriod(Number(value))}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">Last 24h</SelectItem>
                      <SelectItem value="168">Last week</SelectItem>
                      <SelectItem value="720">Last month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {trendingLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : trendingWorkouts && trendingWorkouts.length > 0 ? (
                  <div className="space-y-4">
                    {trendingWorkouts.slice(0, 5).map((post: Post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No trending workouts found for this period.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Workouts */}
            <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Recent Workouts</CardTitle>
              </CardHeader>
              <CardContent>
                {postsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : workoutPosts.length > 0 ? (
                  <div className="space-y-4">
                    {workoutPosts.map((post: Post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No workouts shared yet. Be the first to log a workout!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}