import { useState } from "react";
import { Plus, Trash2, Save, Camera, Timer, Zap, Dumbbell, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CURRENT_USER_ID } from "@/lib/constants";
import { useLocation } from "wouter";
import type { InsertPost, Exercise as ExerciseType } from "@shared/schema";

interface WorkoutSet {
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  rest?: number;
}

interface Exercise {
  name: string;
  sets: WorkoutSet[];
  notes?: string;
}

export default function LogWorkout() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [workoutName, setWorkoutName] = useState("");
  const [caption, setCaption] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [startTime] = useState(new Date());
  const [duration, setDuration] = useState(0);
  const [calories, setCalories] = useState(0);
  const [exerciseSearchOpen, setExerciseSearchOpen] = useState<number | null>(null);

  // Fetch exercise library for autocomplete
  const { data: exerciseLibrary } = useQuery({
    queryKey: ["/api/exercises"],
    queryFn: () => api.getExercises({}),
  });

  const addExercise = () => {
    setExercises([...exercises, { name: "", sets: [{ reps: 1 }], notes: "" }]);
  };

  const selectExerciseFromLibrary = (exerciseIndex: number, libraryExercise: ExerciseType) => {
    const updated = [...exercises];
    updated[exerciseIndex] = { 
      ...updated[exerciseIndex], 
      name: libraryExercise.name 
    };
    setExercises(updated);
    setExerciseSearchOpen(null);
  };

  const workoutTemplates = {
    "Upper Body": [
      { name: "Bench Press", sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }] },
      { name: "Push-ups", sets: [{ reps: 15 }, { reps: 12 }, { reps: 10 }] },
      { name: "Pull-ups", sets: [{ reps: 8 }, { reps: 6 }, { reps: 5 }] },
    ],
    "Lower Body": [
      { name: "Squats", sets: [{ reps: 12 }, { reps: 10 }, { reps: 8 }] },
      { name: "Deadlift", sets: [{ reps: 8 }, { reps: 6 }, { reps: 5 }] },
      { name: "Lunges", sets: [{ reps: 12 }, { reps: 12 }] },
    ],
    "Full Body": [
      { name: "Squats", sets: [{ reps: 12 }, { reps: 10 }] },
      { name: "Push-ups", sets: [{ reps: 15 }, { reps: 12 }] },
      { name: "Deadlift", sets: [{ reps: 8 }, { reps: 6 }] },
      { name: "Plank", sets: [{ reps: 1, duration: 30 }, { reps: 1, duration: 45 }] },
    ]
  };

  const applyWorkoutTemplate = (templateName: string) => {
    const template = workoutTemplates[templateName as keyof typeof workoutTemplates];
    if (template) {
      setExercises(template.map(ex => ({ ...ex, notes: "" })));
      toast({
        title: "Template applied!",
        description: `${templateName} workout template has been loaded.`,
      });
    }
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const addSet = (exerciseIndex: number) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets.push({ reps: 1 });
    setExercises(updated);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter((_, i) => i !== setIndex);
    setExercises(updated);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof WorkoutSet, value: number) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex] = { 
      ...updated[exerciseIndex].sets[setIndex], 
      [field]: value || (field === 'reps' ? 1 : undefined)
    };
    setExercises(updated);
  };

  const addImage = () => {
    // For demo purposes, adding placeholder images
    const demoImages = [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1583500178690-f7fbd652937f?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=800&h=600&fit=crop"
    ];
    if (images.length < 4) {
      setImages([...images, demoImages[images.length % demoImages.length]]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const saveWorkoutMutation = useMutation({
    mutationFn: async (workoutData: InsertPost) => {
      return api.createPost(workoutData);
    },
    onSuccess: () => {
      toast({
        title: "Workout logged!",
        description: "Your workout has been saved and shared with your followers.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setLocation("/feed");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save workout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveWorkout = () => {
    if (!workoutName || exercises.length === 0) {
      toast({
        title: "Missing information",
        description: "Please add a workout name and at least one exercise.",
        variant: "destructive",
      });
      return;
    }

    const workoutData: InsertPost = {
      userId: CURRENT_USER_ID,
      type: "workout",
      caption: caption || `Just completed ${workoutName}! 💪`,
      images,
      workoutData: {
        workoutType: workoutName,
        duration,
        calories,
        exercises: exercises
          .filter(ex => ex.name && ex.sets.length > 0)
          .map(ex => ({
            ...ex,
            sets: ex.sets.map(set => ({
              ...set,
              reps: set.reps || 1 // Ensure reps is always defined
            }))
          })),
      },
    };

    saveWorkoutMutation.mutate(workoutData);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Log Workout</h1>
            <p className="text-gray-600 dark:text-gray-400">Track your exercise progress</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="flex items-center space-x-1">
              <Timer className="h-3 w-3" />
              <span>{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</span>
            </Badge>
            <Button onClick={() => setLocation("/workouts")} variant="outline">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveWorkout}
              disabled={saveWorkoutMutation.isPending}
              className="bg-fit-green hover:bg-fit-green/90"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Workout
            </Button>
          </div>
        </div>

        {/* Workout Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Dumbbell className="h-5 w-5" />
              <span>Workout Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Workout Name
                </label>
                <Input
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  placeholder="e.g., Upper Body Strength"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Duration (minutes)
                </label>
                <Input
                  type="number"
                  value={duration || ""}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  placeholder="45"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Estimated Calories
                </label>
                <Input
                  type="number"
                  value={calories || ""}
                  onChange={(e) => setCalories(Number(e.target.value))}
                  placeholder="320"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Caption (optional)
              </label>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Share how you're feeling about this workout..."
                className="mt-1"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="h-5 w-5" />
                <span>Photos</span>
              </div>
              <Button onClick={addImage} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Photo
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Workout photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      onClick={() => removeImage(index)}
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No photos added yet</p>
                <p className="text-sm">Add photos to share your workout progress</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exercises */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Exercises</span>
                <Badge variant="secondary" className="ml-2">
                  {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Select onValueChange={(value) => value && applyWorkoutTemplate(value)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Use Template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Upper Body">Upper Body</SelectItem>
                    <SelectItem value="Lower Body">Lower Body</SelectItem>
                    <SelectItem value="Full Body">Full Body</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addExercise} className="bg-fit-green hover:bg-fit-green/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exercise
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {exercises.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No exercises added yet</p>
                <p className="text-sm">Start logging your workout by adding exercises</p>
              </div>
            ) : (
              exercises.map((exercise, exerciseIndex) => (
                <div key={exerciseIndex} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <Popover 
                        open={exerciseSearchOpen === exerciseIndex} 
                        onOpenChange={(open) => setExerciseSearchOpen(open ? exerciseIndex : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={exerciseSearchOpen === exerciseIndex}
                            className="w-full justify-between font-medium"
                          >
                            {exercise.name || "Select or type exercise name..."}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
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
                                  <p className="text-xs text-gray-400 mt-1">Keep typing to create a custom exercise</p>
                                </div>
                              </CommandEmpty>
                              {exerciseLibrary && exerciseLibrary.length > 0 && (
                                <CommandGroup heading="Exercise Library">
                                  {exerciseLibrary
                                    .filter(ex => ex.name && ex.name.toLowerCase().includes(exercise.name.toLowerCase()))
                                    .slice(0, 8)
                                    .map((libraryExercise) => (
                                    <CommandItem
                                      key={libraryExercise.id}
                                      value={libraryExercise.name}
                                      onSelect={() => selectExerciseFromLibrary(exerciseIndex, libraryExercise)}
                                      className="flex items-center justify-between"
                                    >
                                      <div>
                                        <span className="font-medium">{libraryExercise.name}</span>
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
                    <Button
                      onClick={() => removeExercise(exerciseIndex)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Sets */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
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
                        <div key={setIndex} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Set #{setIndex + 1}
                            </span>
                            <Button
                              onClick={() => removeSet(exerciseIndex, setIndex)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                Reps
                              </label>
                              <Input
                                type="number"
                                value={set.reps || ""}
                                onChange={(e) => updateSet(exerciseIndex, setIndex, "reps", Number(e.target.value))}
                                placeholder="12"
                                className="h-9 text-center"
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
                                placeholder="185"
                                className="h-9 text-center"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                Duration (s)
                              </label>
                              <Input
                                type="number"
                                value={set.duration || ""}
                                onChange={(e) => updateSet(exerciseIndex, setIndex, "duration", Number(e.target.value))}
                                placeholder="30"
                                className="h-9 text-center"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                Rest (s)
                              </label>
                              <Input
                                type="number"
                                value={set.rest || ""}
                                onChange={(e) => updateSet(exerciseIndex, setIndex, "rest", Number(e.target.value))}
                                placeholder="60"
                                className="h-9 text-center"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Exercise Notes */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notes (optional)
                    </label>
                    <Textarea
                      value={exercise.notes || ""}
                      onChange={(e) => updateExercise(exerciseIndex, "notes", e.target.value)}
                      placeholder="How did this exercise feel? Any observations..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}