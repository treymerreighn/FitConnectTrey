import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Trash2, Camera, Upload, X, Dumbbell, Clock, Flame, Target, Search, ChevronDown, ChevronUp, Save, Check, Filter, Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CURRENT_USER_ID } from "@/lib/constants";
import { useLocation } from "wouter";
import { ImageUpload } from "@/components/image-upload";
import type { InsertPost, Exercise as ExerciseType } from "@shared/schema";

interface WorkoutSet {
  reps: number;
  weight?: number;
  duration?: number;
  distance?: number;
  rest?: number;
}

interface WorkoutExercise {
  id?: string;
  name: string;
  sets: WorkoutSet[];
  notes?: string;
}

const extractSearchParams = (path: string) => {
  if (typeof window !== "undefined" && window.location?.search) {
    return new URLSearchParams(window.location.search);
  }
  const queryIndex = path.indexOf("?");
  const raw = queryIndex >= 0 ? path.substring(queryIndex) : "";
  return new URLSearchParams(raw);
};

const parseWorkoutDataFromParams = (params: URLSearchParams) => {
  const raw = params.get("workoutData");
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch (err) {
    console.error("Failed to parse workoutData", err);
    return null;
  }
};

export default function CreatePost() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const searchParams = useMemo(() => extractSearchParams(location), [location]);
  const incomingWorkoutData = useMemo(() => parseWorkoutDataFromParams(searchParams), [searchParams]);

  // Get type from URL query params if provided
  const urlType = new URLSearchParams(location.split('?')[1]).get('type');
  const initialType = (urlType === 'nutrition' || urlType === 'progress') ? urlType : 
                      incomingWorkoutData ? "workout" : "workout";

  // Post type selection
  const [postType, setPostType] = useState<"workout" | "nutrition" | "progress">(initialType);
  
  // Common fields
  const [caption, setCaption] = useState("");
  const [images, setImages] = useState<string[]>([]);
  
  // Workout specific
  const [workoutName, setWorkoutName] = useState(incomingWorkoutData?.workoutType || "");
  const [duration, setDuration] = useState<number>(incomingWorkoutData?.duration || 0);
  const [calories, setCalories] = useState<number>(incomingWorkoutData?.calories || 0);
  const [exercises, setExercises] = useState<WorkoutExercise[]>(
    (incomingWorkoutData?.exercises || []).map((ex: any) => ({
      id: ex.id,
      name: ex.exerciseName || ex.name || "",
      notes: ex.notes,
      sets: (ex.sets || []).map((set: any) => ({
        reps: set.reps ?? set.targetReps ?? 0,
        weight: set.weight ?? set.targetWeight ?? 0,
        duration: set.duration,
        distance: set.distance,
        rest: set.rest ?? set.restTime,
      })),
    }))
  );
  const [exerciseSearchOpen, setExerciseSearchOpen] = useState<number | null>(null);
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(new Set());
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Nutrition specific
  const [mealType, setMealType] = useState("");
  const [protein, setProtein] = useState<number>(0);
  const [carbs, setCarbs] = useState<number>(0);
  const [fat, setFat] = useState<number>(0);
  
  // Progress specific
  const [progressType, setProgressType] = useState("");
  const [weightLost, setWeightLost] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [muscleGain, setMuscleGain] = useState("");
  const [progressDuration, setProgressDuration] = useState("");

  // Fetch exercise library
  const { data: exerciseLibrary = [] } = useQuery({
    queryKey: ["/api/exercises"],
    queryFn: () => api.getExercises({}),
  });

  const addImage = (imageUrl: string) => {
    console.log('🖼️ Adding image to post:', imageUrl);
    if (images.length < 4) {
      setImages([...images, imageUrl]);
      console.log('✅ Images array now:', [...images, imageUrl]);
      toast({
        title: "Photo added!",
        description: "Photo uploaded successfully.",
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const addExercise = () => {
    setLibraryOpen(true);
  };

  const addExerciseFromLibrary = (libraryExercise: ExerciseType) => {
    const newExercise: WorkoutExercise = {
      id: libraryExercise.id,
      name: libraryExercise.name,
      sets: [{ reps: 12, weight: 0 }],
      notes: ""
    };
    setExercises([...exercises, newExercise]);
    setExpandedExercises(new Set([...expandedExercises, exercises.length]));
    setLibraryOpen(false);
  };

  const addBlankExercise = () => {
    setExercises([...exercises, { name: "", sets: [{ reps: 12, weight: 0 }], notes: "" }]);
    setExpandedExercises(new Set([...expandedExercises, exercises.length]));
    setLibraryOpen(false);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
    const newExpanded = new Set(expandedExercises);
    newExpanded.delete(index);
    setExpandedExercises(newExpanded);
  };

  const updateExercise = (index: number, field: keyof WorkoutExercise, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const selectExerciseFromLibrary = (exerciseIndex: number, libraryExercise: ExerciseType) => {
    updateExercise(exerciseIndex, "name", libraryExercise.name);
    updateExercise(exerciseIndex, "id", libraryExercise.id);
    setExerciseSearchOpen(null);
  };

  const addSet = (exerciseIndex: number) => {
    const updated = [...exercises];
    const lastSet = updated[exerciseIndex].sets[updated[exerciseIndex].sets.length - 1];
    updated[exerciseIndex].sets.push({ 
      reps: lastSet?.reps || 12, 
      weight: lastSet?.weight || 0 
    });
    setExercises(updated);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter((_, i) => i !== setIndex);
    setExercises(updated);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof WorkoutSet, value: number) => {
    const updated = [...exercises];
    const current = updated[exerciseIndex].sets[setIndex] || { reps: 0 };
    updated[exerciseIndex].sets[setIndex] = {
      ...current,
      [field]: value,
    } as WorkoutSet;
    setExercises(updated);
  };

  const toggleExerciseExpanded = (index: number) => {
    const newExpanded = new Set(expandedExercises);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedExercises(newExpanded);
  };

  const createPostMutation = useMutation({
    mutationFn: async (postData: InsertPost) => {
      console.log('📤 Sending post data:', JSON.stringify(postData, null, 2));
      const result = await api.createPost(postData);
      console.log('✅ Post created:', result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Post created!",
        description: `Your ${postType} post has been shared successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!caption && postType !== "workout") {
      toast({
        title: "Missing caption",
        description: "Please add a caption for your post.",
        variant: "destructive",
      });
      return;
    }

    if (postType === "workout" && (!workoutName || exercises.length === 0)) {
      toast({
        title: "Incomplete workout",
        description: "Please add a workout name and at least one exercise.",
        variant: "destructive",
      });
      return;
    }

    const workoutCaptionFallback = workoutName ? `Just completed ${workoutName}! 💪` : "";
    let postData: InsertPost = {
      userId: CURRENT_USER_ID,
      type: postType,
      caption: caption || (postType === "workout" ? workoutCaptionFallback : ""),
      images,
    };

    if (postType === "workout") {
      postData.workoutData = {
        workoutType: workoutName,
        duration,
        calories,
        exercises: exercises.filter(ex => ex.name && ex.sets.length > 0),
      };
    } else if (postType === "nutrition") {
      postData.nutritionData = {
        mealType,
        calories,
        protein,
        carbs,
        fat,
      };
    } else if (postType === "progress") {
      postData.progressData = {
        progressType,
        weightLost,
        bodyFat,
        muscleGain,
        duration: progressDuration,
      };
    }

    createPostMutation.mutate(postData);
  };

  const totalSets = exercises.reduce((total, ex) => total + ex.sets.length, 0);
  const completionProgress = postType === "workout" 
    ? (workoutName && exercises.length > 0 ? 80 : 40) 
    : (caption ? 60 : 20);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Create Post</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Progress value={completionProgress} className="w-24 h-1" />
              <span className="text-xs text-gray-500">{completionProgress}%</span>
            </div>
          </div>
          <Button 
            onClick={handleSubmit}
            disabled={createPostMutation.isPending}
            className="bg-fit-green hover:bg-fit-green/90 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {createPostMutation.isPending ? "Posting..." : "Post"}
          </Button>
        </div>

        {/* Post Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>What are you sharing?</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant={postType === "workout" ? "default" : "outline"}
                onClick={() => setPostType("workout")}
                className={`h-20 flex-col space-y-2 ${postType === "workout" ? "bg-fit-green hover:bg-fit-green/90" : ""}`}
              >
                <Dumbbell className="h-6 w-6" />
                <span>Workout</span>
              </Button>
              <Button
                variant={postType === "nutrition" ? "default" : "outline"}
                onClick={() => setPostType("nutrition")}
                className={`h-20 flex-col space-y-2 ${postType === "nutrition" ? "bg-fit-green hover:bg-fit-green/90" : ""}`}
              >
                <Flame className="h-6 w-6" />
                <span>Nutrition</span>
              </Button>
              <Button
                variant={postType === "progress" ? "default" : "outline"}
                onClick={() => setPostType("progress")}
                className={`h-20 flex-col space-y-2 ${postType === "progress" ? "bg-fit-green hover:bg-fit-green/90" : ""}`}
              >
                <Target className="h-6 w-6" />
                <span>Progress</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Photos Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="h-5 w-5" />
                <span>Photos</span>
                <Badge variant="secondary">{images.length}/4</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {images.length < 4 && (
              <ImageUpload 
                onImageUploaded={addImage}
                label={`Add ${postType} photo`}
                className="w-full"
              />
            )}
            
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
                    />
                    <Button
                      onClick={() => removeImage(index)}
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workout Content */}
        {postType === "workout" && (
          <>
            {/* Workout Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Dumbbell className="h-5 w-5" />
                  <span>Workout Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Workout Name *
                  </label>
                  <Input
                    value={workoutName}
                    onChange={(e) => setWorkoutName(e.target.value)}
                    placeholder="e.g., Upper Body Strength, Morning Cardio"
                    className="text-lg font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Duration (minutes)</span>
                    </label>
                    <Input
                      type="number"
                      value={duration || ""}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      placeholder="45"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-1">
                      <Flame className="h-4 w-4" />
                      <span>Calories</span>
                    </label>
                    <Input
                      type="number"
                      value={calories || ""}
                      onChange={(e) => setCalories(Number(e.target.value))}
                      placeholder="320"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Caption (optional)
                  </label>
                  <Textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Share how you're feeling about this workout..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Exercises */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Dumbbell className="h-5 w-5" />
                    <span>Exercises</span>
                    <Badge variant="secondary">{exercises.length} exercises</Badge>
                    <Badge variant="outline">{totalSets} sets</Badge>
                  </div>
                  <Button onClick={addExercise} className="bg-fit-green hover:bg-fit-green/90">
                    <Book className="h-4 w-4 mr-2" />
                    Exercise Library
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {exercises.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No exercises added yet</p>
                    <p className="text-sm">Browse the exercise library to get started</p>
                    <Button 
                      onClick={addExercise} 
                      className="mt-4 bg-fit-green hover:bg-fit-green/90"
                    >
                      <Book className="h-4 w-4 mr-2" />
                      Browse Exercise Library
                    </Button>
                  </div>
                ) : (
                  exercises.map((exercise, exerciseIndex) => (
                    <div key={exerciseIndex} className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      {/* Exercise Header */}
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-4">
                            <Popover 
                              open={exerciseSearchOpen === exerciseIndex} 
                              onOpenChange={(open) => setExerciseSearchOpen(open ? exerciseIndex : null)}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between font-medium text-left"
                                >
                                  {exercise.name || "Select exercise..."}
                                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-96 p-0" align="start">
                                <Command>
                                  <CommandInput 
                                    placeholder="Search exercises..." 
                                    value={exercise.name}
                                    onValueChange={(value) => updateExercise(exerciseIndex, "name", value)}
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      <div className="p-4 text-center">
                                        <p className="text-sm text-gray-500">No exercises found.</p>
                                        <p className="text-xs text-gray-400 mt-1">Keep typing to create custom exercise</p>
                                      </div>
                                    </CommandEmpty>
                                    {exerciseLibrary.length > 0 && (
                                      <CommandGroup heading="Exercise Library">
                                        {exerciseLibrary
                                          .filter(ex => ex.name && ex.name.toLowerCase().includes(exercise.name.toLowerCase()))
                                          .slice(0, 8)
                                          .map((libraryExercise) => (
                                          <CommandItem
                                            key={libraryExercise.id}
                                            value={libraryExercise.name}
                                            onSelect={() => selectExerciseFromLibrary(exerciseIndex, libraryExercise)}
                                            className="flex items-center justify-between p-3"
                                          >
                                            <div>
                                              <div className="font-medium">{libraryExercise.name}</div>
                                              <div className="flex gap-1 mt-1">
                                                <Badge variant="secondary" className="text-xs">
                                                  {libraryExercise.category}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                  {libraryExercise.difficulty}
                                                </Badge>
                                              </div>
                                            </div>
                                            <Check className="h-4 w-4" />
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    )}
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExerciseExpanded(exerciseIndex)}
                            >
                              {expandedExercises.has(exerciseIndex) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExercise(exerciseIndex)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Exercise Summary */}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>{exercise.sets.length} sets</span>
                          {exercise.sets.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{exercise.sets[0].reps} reps</span>
                              {exercise.sets[0].weight && exercise.sets[0].weight > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{exercise.sets[0].weight} lbs</span>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Expanded Sets Details */}
                      {expandedExercises.has(exerciseIndex) && (
                        <div className="border-t border-gray-200 dark:border-gray-600 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-sm">Sets</h4>
                            <Button
                              onClick={() => addSet(exerciseIndex)}
                              variant="outline"
                              size="sm"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Set
                            </Button>
                          </div>
                          
                          <div className="space-y-3">
                            {exercise.sets.map((set, setIndex) => (
                              <div key={setIndex} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Set {setIndex + 1}
                                  </span>
                                  <Button
                                    onClick={() => removeSet(exerciseIndex, setIndex)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                      Reps
                                    </label>
                                    <Input
                                      type="number"
                                      value={set.reps || ""}
                                      onChange={(e) => updateSet(exerciseIndex, setIndex, "reps", Number(e.target.value))}
                                      placeholder="12"
                                      className="h-8 text-center"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                      Weight (lbs)
                                    </label>
                                    <Input
                                      type="number"
                                      value={set.weight || ""}
                                      onChange={(e) => updateSet(exerciseIndex, setIndex, "weight", Number(e.target.value))}
                                      placeholder="135"
                                      className="h-8 text-center"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                      Rest (sec)
                                    </label>
                                    <Input
                                      type="number"
                                      value={set.rest || ""}
                                      onChange={(e) => updateSet(exerciseIndex, setIndex, "rest", Number(e.target.value))}
                                      placeholder="60"
                                      className="h-8 text-center"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Exercise Notes */}
                          <div className="mt-4">
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                              Exercise Notes
                            </label>
                            <Textarea
                              value={exercise.notes || ""}
                              onChange={(e) => updateExercise(exerciseIndex, "notes", e.target.value)}
                              placeholder="Form notes, modifications, etc..."
                              rows={2}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Nutrition Content */}
        {postType === "nutrition" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Flame className="h-5 w-5" />
                <span>Nutrition Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Meal Type
                </label>
                <Select value={mealType} onValueChange={setMealType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select meal type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                    <SelectItem value="pre-workout">Pre-workout</SelectItem>
                    <SelectItem value="post-workout">Post-workout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Calories
                  </label>
                  <Input
                    type="number"
                    value={calories || ""}
                    onChange={(e) => setCalories(Number(e.target.value))}
                    placeholder="450"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Protein (g)
                  </label>
                  <Input
                    type="number"
                    value={protein || ""}
                    onChange={(e) => setProtein(Number(e.target.value))}
                    placeholder="25"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Carbs (g)
                  </label>
                  <Input
                    type="number"
                    value={carbs || ""}
                    onChange={(e) => setCarbs(Number(e.target.value))}
                    placeholder="40"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Fat (g)
                  </label>
                  <Input
                    type="number"
                    value={fat || ""}
                    onChange={(e) => setFat(Number(e.target.value))}
                    placeholder="15"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Caption
                </label>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Share details about your meal..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Content */}
        {postType === "progress" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Progress Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Progress Type
                </label>
                <Select value={progressType} onValueChange={setProgressType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select progress type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight-loss">Weight Loss</SelectItem>
                    <SelectItem value="muscle-gain">Muscle Gain</SelectItem>
                    <SelectItem value="strength">Strength Gain</SelectItem>
                    <SelectItem value="endurance">Endurance</SelectItem>
                    <SelectItem value="body-fat">Body Fat Reduction</SelectItem>
                    <SelectItem value="transformation">Transformation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Weight Lost
                  </label>
                  <Input
                    value={weightLost}
                    onChange={(e) => setWeightLost(e.target.value)}
                    placeholder="10 lbs"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Body Fat %
                  </label>
                  <Input
                    value={bodyFat}
                    onChange={(e) => setBodyFat(e.target.value)}
                    placeholder="15%"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Muscle Gain
                  </label>
                  <Input
                    value={muscleGain}
                    onChange={(e) => setMuscleGain(e.target.value)}
                    placeholder="5 lbs"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Time Period
                  </label>
                  <Input
                    value={progressDuration}
                    onChange={(e) => setProgressDuration(e.target.value)}
                    placeholder="3 months"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Caption
                </label>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Share your progress story..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exercise Library Modal */}
        <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Book className="h-5 w-5" />
                <span>Exercise Library</span>
              </DialogTitle>
              <DialogDescription>
                Browse and add exercises to your workout
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col h-full">
              {/* Search and Filter */}
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search exercises..."
                    value={librarySearch}
                    onChange={(e) => setLibrarySearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="strength">Strength</SelectItem>
                    <SelectItem value="cardio">Cardio</SelectItem>
                    <SelectItem value="core">Core</SelectItem>
                    <SelectItem value="flexibility">Flexibility</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Exercise Grid */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exerciseLibrary
                    .filter(ex => {
                      const matchesSearch = librarySearch === "" || 
                        ex.name.toLowerCase().includes(librarySearch.toLowerCase()) ||
                        (ex.description && ex.description.toLowerCase().includes(librarySearch.toLowerCase()));
                      const matchesCategory = selectedCategory === "all" || ex.category === selectedCategory;
                      return matchesSearch && matchesCategory;
                    })
                    .map((exercise) => (
                      <Card key={exercise.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{exercise.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {exercise.description}
                              </p>
                            </div>
                            <Button
                              onClick={() => addExerciseFromLibrary(exercise)}
                              size="sm"
                              className="bg-fit-green hover:bg-fit-green/90"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mb-3">
                            <Badge variant="secondary" className="text-xs">
                              {exercise.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {exercise.difficulty}
                            </Badge>
                            {exercise.muscleGroups && exercise.muscleGroups.slice(0, 2).map((muscle, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {muscle}
                              </Badge>
                            ))}
                          </div>
                          
                          {exercise.equipment && exercise.equipment.length > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Equipment: {exercise.equipment.join(", ")}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
                
                {exerciseLibrary.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No exercises found</p>
                    <p className="text-sm">Try adjusting your search or category filter</p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={addBlankExercise}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Custom Exercise</span>
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setLibraryOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
