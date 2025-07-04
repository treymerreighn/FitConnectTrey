import { useState } from "react";
import { Plus, Trash2, Save, Camera, Timer, Zap, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CURRENT_USER_ID } from "@/lib/constants";
import { useLocation } from "wouter";
import type { InsertPost } from "@shared/schema";

interface WorkoutSet {
  reps: number;
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

  const addExercise = () => {
    setExercises([...exercises, { name: "", sets: [{ reps: 0 }], notes: "" }]);
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
    updated[exerciseIndex].sets.push({ reps: 0 });
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
      [field]: value 
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
        exercises: exercises.filter(ex => ex.name && ex.sets.length > 0),
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
              </div>
              <Button onClick={addExercise} className="bg-fit-green hover:bg-fit-green/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Exercise
              </Button>
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
                <div key={exerciseIndex} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Input
                      value={exercise.name}
                      onChange={(e) => updateExercise(exerciseIndex, "name", e.target.value)}
                      placeholder="Exercise name (e.g., Bench Press)"
                      className="font-medium"
                    />
                    <Button
                      onClick={() => removeExercise(exerciseIndex)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
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
                    
                    <div className="grid gap-2">
                      {exercise.sets.map((set, setIndex) => (
                        <div key={setIndex} className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                          <span className="text-sm font-medium w-8">#{setIndex + 1}</span>
                          
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div>
                              <label className="text-xs text-gray-500">Reps</label>
                              <Input
                                type="number"
                                value={set.reps || ""}
                                onChange={(e) => updateSet(exerciseIndex, setIndex, "reps", Number(e.target.value))}
                                placeholder="12"
                                className="h-8"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Weight (lbs)</label>
                              <Input
                                type="number"
                                value={set.weight || ""}
                                onChange={(e) => updateSet(exerciseIndex, setIndex, "weight", Number(e.target.value))}
                                placeholder="185"
                                className="h-8"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Duration (s)</label>
                              <Input
                                type="number"
                                value={set.duration || ""}
                                onChange={(e) => updateSet(exerciseIndex, setIndex, "duration", Number(e.target.value))}
                                placeholder="30"
                                className="h-8"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Rest (s)</label>
                              <Input
                                type="number"
                                value={set.rest || ""}
                                onChange={(e) => updateSet(exerciseIndex, setIndex, "rest", Number(e.target.value))}
                                placeholder="60"
                                className="h-8"
                              />
                            </div>
                          </div>
                          
                          <Button
                            onClick={() => removeSet(exerciseIndex, setIndex)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
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