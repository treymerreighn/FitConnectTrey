import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Play, Share, Sparkles, Target, Clock, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
  equipment: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  thumbnailUrl: string;
  instructions: string[];
  targetSets?: number;
  targetReps?: number;
  restTime?: number;
}

interface WorkoutPlan {
  name: string;
  description: string;
  exercises: Exercise[];
  targetBodyParts: string[];
  estimatedDuration: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

const BODY_PARTS = [
  { id: "chest", name: "Chest", icon: "💪", exercises: ["Push-ups", "Bench Press", "Chest Flyes"] },
  { id: "back", name: "Back", icon: "🏋️", exercises: ["Pull-ups", "Rows", "Deadlifts"] },
  { id: "shoulders", name: "Shoulders", icon: "🔥", exercises: ["Shoulder Press", "Lateral Raises", "Front Raises"] },
  { id: "arms", name: "Arms", icon: "💪", exercises: ["Bicep Curls", "Tricep Dips", "Hammer Curls"] },
  { id: "legs", name: "Legs", icon: "🦵", exercises: ["Squats", "Lunges", "Leg Press"] },
  { id: "core", name: "Core", icon: "⚡", exercises: ["Planks", "Crunches", "Russian Twists"] },
  { id: "glutes", name: "Glutes", icon: "🍑", exercises: ["Hip Thrusts", "Glute Bridges", "Bulgarian Squats"] },
  { id: "full-body", name: "Full Body", icon: "🔥", exercises: ["Burpees", "Mountain Climbers", "Jumping Jacks"] }
];

const MOCK_EXERCISES: Exercise[] = [
  {
    id: "1",
    name: "Push-ups",
    category: "Strength",
    muscleGroups: ["Chest", "Triceps", "Shoulders"],
    equipment: ["None"],
    difficulty: "Beginner",
    thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
    instructions: ["Start in plank position", "Lower body until chest nearly touches floor", "Push back up to starting position"],
    targetSets: 3,
    targetReps: 12,
    restTime: 60
  },
  {
    id: "2",
    name: "Squats",
    category: "Strength", 
    muscleGroups: ["Quadriceps", "Glutes", "Hamstrings"],
    equipment: ["None"],
    difficulty: "Beginner",
    thumbnailUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400",
    instructions: ["Stand with feet shoulder-width apart", "Lower hips back and down", "Return to standing position"],
    targetSets: 3,
    targetReps: 15,
    restTime: 90
  },
  {
    id: "3",
    name: "Pull-ups",
    category: "Strength",
    muscleGroups: ["Lats", "Biceps", "Rhomboids"],
    equipment: ["Pull-up Bar"],
    difficulty: "Intermediate",
    thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
    instructions: ["Hang from bar with palms facing away", "Pull up until chin clears bar", "Lower slowly to starting position"],
    targetSets: 3,
    targetReps: 8,
    restTime: 120
  }
];

export default function BuildWorkout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Fetch exercises from the database
  const { data: exercises = [] } = useQuery({
    queryKey: ["/api/exercises"],
    queryFn: () => fetch("/api/exercises").then(res => res.json()),
  });
  
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan>({
    name: "",
    description: "",
    exercises: [],
    targetBodyParts: [],
    estimatedDuration: 0,
    difficulty: "Beginner"
  });
  
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAIBuilder, setShowAIBuilder] = useState(false);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const filteredExercises = (exercises.length > 0 ? exercises : MOCK_EXERCISES).filter(exercise => {
    if (selectedBodyParts.length === 0) return true;
    return exercise.muscleGroups.some(muscle => 
      selectedBodyParts.some(bodyPart => 
        BODY_PARTS.find(bp => bp.id === bodyPart)?.exercises.some(ex => 
          muscle.toLowerCase().includes(ex.toLowerCase().split(' ')[0])
        )
      )
    );
  });

  const toggleBodyPart = (bodyPartId: string) => {
    setSelectedBodyParts(prev => 
      prev.includes(bodyPartId) 
        ? prev.filter(id => id !== bodyPartId)
        : [...prev, bodyPartId]
    );
  };

  const addExerciseToWorkout = (exercise: Exercise) => {
    setWorkoutPlan(prev => ({
      ...prev,
      exercises: [...prev.exercises, exercise],
      estimatedDuration: prev.estimatedDuration + (exercise.targetSets || 3) * 2 // 2 min per set estimate
    }));
    setShowExerciseLibrary(false); // Close modal after adding
    toast({
      title: "Exercise Added!",
      description: `${exercise.name} has been added to your workout`
    });
  };

  const removeExerciseFromWorkout = (exerciseId: string) => {
    setWorkoutPlan(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== exerciseId),
      estimatedDuration: Math.max(0, prev.estimatedDuration - 6) // Remove 6 min estimate
    }));
  };

  const updateExerciseSets = (exerciseId: string, newSets: number) => {
    setWorkoutPlan(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, targetSets: newSets } : ex
      )
    }));
  };

  const updateExerciseReps = (exerciseId: string, newReps: number) => {
    setWorkoutPlan(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, targetReps: newReps } : ex
      )
    }));
  };

  const generateAIWorkout = async () => {
    setIsGeneratingAI(true);
    
    try {
      const response = await fetch("/api/generate-workout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bodyParts: selectedBodyParts,
          fitnessLevel: "intermediate",
          duration: 45,
          equipment: ["None", "Dumbbells", "Barbell"],
          goals: aiPrompt || `Build strength and muscle in ${selectedBodyParts.join(", ")}`,
          userPrompt: aiPrompt
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate workout");
      }

      const aiWorkout = await response.json();
      
      // Convert AI response to our workout plan format
      const exercises = aiWorkout.exercises.map((ex: any, index: number) => ({
        id: `ai-${index + 1}`,
        name: ex.name,
        category: "Strength",
        muscleGroups: ex.muscleGroups || ["Full Body"],
        equipment: ["Various"],
        difficulty: ex.difficulty,
        thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
        instructions: ex.instructions || [],
        targetSets: ex.sets,
        targetReps: typeof ex.reps === 'string' ? parseInt(ex.reps.split('-')[0]) : ex.reps,
        restTime: ex.restTime
      }));
      
      setWorkoutPlan({
        name: aiWorkout.name,
        description: aiWorkout.description,
        exercises: exercises,
        targetBodyParts: selectedBodyParts,
        estimatedDuration: aiWorkout.estimatedDuration,
        difficulty: aiWorkout.difficulty
      });
      
      setIsGeneratingAI(false);
      setShowAIBuilder(false);
      
      toast({
        title: "AI Workout Generated!",
        description: "Your personalized workout plan is ready"
      });
    } catch (error) {
      console.error("Failed to generate AI workout:", error);
      setIsGeneratingAI(false);
      
      toast({
        title: "Generation Failed",
        description: "Failed to generate workout. Please try again.",
        variant: "destructive"
      });
    }
  };

  const startWorkout = () => {
    const exerciseIds = workoutPlan.exercises.map(ex => ex.id).join(',');
    setLocation(`/workout-session?exercises=${exerciseIds}&plan=${encodeURIComponent(JSON.stringify(workoutPlan))}`);
  };

  const postWorkout = async () => {
    try {
      // Post workout plan to social feed
      const postData = {
        type: "workout_plan",
        content: workoutPlan.description,
        workoutPlan: workoutPlan,
        createdAt: new Date().toISOString()
      };
      
      toast({
        title: "Workout Posted!",
        description: "Your workout plan has been shared with your followers"
      });
      
      setLocation("/");
    } catch (error) {
      toast({
        title: "Post Failed",
        description: "Failed to share workout plan",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/workouts")}
              className="text-gray-400"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Build Workout</h1>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAIBuilder(true)}
              className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Generate
            </Button>
          </div>
        </div>
      </div>

      {/* Body Parts Selection */}
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Target Body Parts</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BODY_PARTS.map(bodyPart => (
              <Card
                key={bodyPart.id}
                className={`cursor-pointer transition-all ${
                  selectedBodyParts.includes(bodyPart.id)
                    ? 'bg-red-600/20 border-red-500 ring-2 ring-red-500/50'
                    : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                }`}
                onClick={() => toggleBodyPart(bodyPart.id)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{bodyPart.icon}</div>
                  <div className="font-medium text-sm">{bodyPart.name}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Workout Plan */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Workout Plan</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExerciseLibrary(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Exercise
            </Button>
          </div>

          {workoutPlan.exercises.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-gray-300">No exercises added yet</h3>
                <p className="text-gray-400 mb-4">Select body parts and add exercises to build your workout</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button onClick={() => setShowExerciseLibrary(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Exercise
                  </Button>
                  <Button variant="outline" onClick={() => setShowAIBuilder(true)}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Generate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Workout Summary */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-red-400">{workoutPlan.exercises.length}</div>
                      <div className="text-xs text-gray-400">Exercises</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{workoutPlan.estimatedDuration}m</div>
                      <div className="text-xs text-gray-400">Est. Duration</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-400">
                        {workoutPlan.exercises.reduce((acc, ex) => acc + (ex.targetSets || 3), 0)}
                      </div>
                      <div className="text-xs text-gray-400">Total Sets</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exercise List */}
              {workoutPlan.exercises.map((exercise, index) => (
                <Card key={exercise.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                        <img 
                          src={exercise.thumbnailUrl} 
                          alt={exercise.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-white">{exercise.name}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExerciseFromWorkout(exercise.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-2">
                          {/* Sets Control */}
                          <div className="flex items-center space-x-2">
                            <label className="text-xs text-gray-400">Sets:</label>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateExerciseSets(exercise.id, Math.max(1, (exercise.targetSets || 3) - 1))}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                              >
                                -
                              </Button>
                              <span className="text-sm text-white min-w-[20px] text-center">
                                {exercise.targetSets || 3}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateExerciseSets(exercise.id, Math.min(10, (exercise.targetSets || 3) + 1))}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                              >
                                +
                              </Button>
                            </div>
                          </div>

                          {/* Reps Control */}
                          <div className="flex items-center space-x-2">
                            <label className="text-xs text-gray-400">Reps:</label>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateExerciseReps(exercise.id, Math.max(1, (exercise.targetReps || 10) - 1))}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                              >
                                -
                              </Button>
                              <span className="text-sm text-white min-w-[20px] text-center">
                                {exercise.targetReps || 10}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateExerciseReps(exercise.id, Math.min(50, (exercise.targetReps || 10) + 1))}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                              >
                                +
                              </Button>
                            </div>
                          </div>

                          <Badge variant="secondary" className="text-xs">
                            {exercise.difficulty}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          {exercise.muscleGroups.slice(0, 3).map(muscle => (
                            <Badge key={muscle} variant="outline" className="text-xs">
                              {muscle}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-gray-900 pt-4 pb-4 mt-6 border-t border-gray-700">
                <div className="flex space-x-3">
                  <Button
                    onClick={startWorkout}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    size="lg"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Start Workout
                  </Button>
                  <Button
                    onClick={() => setShowSaveOptions(true)}
                    className="bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => setShowPostOptions(true)}
                    variant="outline"
                    className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                    size="lg"
                  >
                    <Share className="h-5 w-5 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Always visible action buttons when exercises exist */}
          {workoutPlan.exercises.length > 0 && (
            <div className="fixed bottom-20 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-4 z-40">
              <div className="max-w-4xl mx-auto flex space-x-3">
                <Button
                  onClick={startWorkout}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  size="lg"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Workout
                </Button>
                <Button
                  onClick={() => setShowSaveOptions(true)}
                  className="bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  Save
                </Button>
                <Button
                  onClick={() => setShowPostOptions(true)}
                  variant="outline"
                  className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                  size="lg"
                >
                  <Share className="h-5 w-5 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Exercise Library Modal */}
      <Dialog open={showExerciseLibrary} onOpenChange={(open) => {
        setShowExerciseLibrary(open);
        if (!open) {
          setSelectedCategory(null);
        }
      }}>
        <DialogContent className="sm:max-w-2xl bg-gray-800 border-gray-700 text-white max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {selectedCategory && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="mr-2 p-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              {selectedCategory ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1).replace('_', ' ')} Exercises` : "By Muscle Groups"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto max-h-[60vh]">
            {!selectedCategory ? (
              // Show Muscle Groups
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-200 mb-4">By Muscle Groups</h3>
                <div className="space-y-2">
                  {[
                    { id: "chest", name: "Chest", icon: "🫁", description: "Pectorals and upper body" },
                    { id: "abs", name: "Abs", icon: "🎯", description: "Core and abdominals" },
                    { id: "back", name: "Back", icon: "🪃", description: "Lats, rhomboids, traps" },
                    { id: "lower_back", name: "Lower Back", icon: "🔙", description: "Spinal erectors" },
                    { id: "shoulders", name: "Shoulders", icon: "🏔️", description: "Deltoids and rotator cuff" },
                    { id: "biceps", name: "Biceps", icon: "💪", description: "Front arm muscles" },
                    { id: "triceps", name: "Triceps", icon: "🔧", description: "Back arm muscles" },
                    { id: "quadriceps", name: "Quadriceps", icon: "🦵", description: "Front thigh muscles" },
                    { id: "hamstrings", name: "Hamstrings", icon: "🦵", description: "Back thigh muscles" },
                    { id: "glutes", name: "Glutes", icon: "🍑", description: "Hip and buttock muscles" },
                    { id: "calves", name: "Calves", icon: "🦵", description: "Lower leg muscles" }
                  ].map(muscleGroup => {
                    const muscleExercises = exercises.filter(ex => 
                      ex.muscleGroups && ex.muscleGroups.some(mg => mg.toLowerCase() === muscleGroup.id)
                    );
                    return (
                      <Card 
                        key={muscleGroup.id} 
                        className="cursor-pointer transition-all hover:bg-gray-700 bg-gray-800 border-gray-700"
                        onClick={() => setSelectedCategory(muscleGroup.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                                <span className="text-xl">{muscleGroup.icon}</span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">{muscleGroup.name}</h4>
                                <p className="text-sm text-gray-400">{muscleGroup.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-400">{muscleExercises.length} exercises</span>
                              <ArrowLeft className="h-4 w-4 text-gray-400 transform rotate-180" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Show Exercises for Selected Muscle Group
              <div className="space-y-3">
                {filteredExercises
                  .filter(exercise => 
                    exercise.muscleGroups && exercise.muscleGroups.some(mg => mg.toLowerCase() === selectedCategory)
                  )
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(exercise => (
                  <Card key={exercise.id} className="bg-gray-700 border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-600">
                            <img 
                              src={exercise.thumbnailUrl} 
                              alt={exercise.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{exercise.name}</h4>
                            <p className="text-sm text-gray-400 capitalize">{exercise.difficulty}</p>
                            <div className="flex space-x-2 mt-1">
                              {exercise.muscleGroups.slice(0, 3).map(muscle => (
                                <Badge key={muscle} variant="secondary" className="text-xs">
                                  {muscle}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            addExerciseToWorkout(exercise);
                            setSelectedCategory(null);
                            setShowExerciseLibrary(false);
                          }}
                          disabled={workoutPlan.exercises.some(ex => ex.id === exercise.id)}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {workoutPlan.exercises.some(ex => ex.id === exercise.id) ? "Added" : "Add"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredExercises.filter(exercise => 
                  exercise.muscleGroups && exercise.muscleGroups.some(mg => mg.toLowerCase() === selectedCategory)
                ).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No exercises found for this muscle group.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Workout Builder Modal */}
      <Dialog open={showAIBuilder} onOpenChange={setShowAIBuilder}>
        <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-purple-400" />
              AI Workout Generator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>What would you like to focus on today?</Label>
              <Textarea
                placeholder="e.g., I want to build upper body strength, focus on chest and shoulders, beginner-friendly workout..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="bg-gray-700 border-gray-600 mt-2"
                rows={4}
              />
            </div>
            
            <div>
              <Label>Selected Body Parts</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedBodyParts.map(bodyPartId => {
                  const bodyPart = BODY_PARTS.find(bp => bp.id === bodyPartId);
                  return (
                    <Badge key={bodyPartId} variant="secondary">
                      {bodyPart?.icon} {bodyPart?.name}
                    </Badge>
                  );
                })}
              </div>
              {selectedBodyParts.length === 0 && (
                <p className="text-sm text-gray-400 mt-1">Select body parts above to include in generation</p>
              )}
            </div>

            <Button
              onClick={generateAIWorkout}
              disabled={isGeneratingAI || selectedBodyParts.length === 0}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isGeneratingAI ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Workout
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Workout Modal */}
      <Dialog open={showSaveOptions} onOpenChange={setShowSaveOptions}>
        <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Save Workout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Workout Name</Label>
              <Input
                placeholder="Enter workout name..."
                value={workoutPlan.name}
                onChange={(e) => setWorkoutPlan(prev => ({ ...prev, name: e.target.value }))}
                className="bg-gray-700 border-gray-600 mt-2"
              />
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Describe your workout..."
                value={workoutPlan.description}
                onChange={(e) => setWorkoutPlan(prev => ({ ...prev, description: e.target.value }))}
                className="bg-gray-700 border-gray-600 mt-2"
                rows={3}
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowSaveOptions(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => {
                  toast({
                    title: "Workout Saved!",
                    description: `"${workoutPlan.name || 'Unnamed Workout'}" saved to your workouts`
                  });
                  setShowSaveOptions(false);
                }}
              >
                Save Workout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Workout Modal */}
      <Dialog open={showPostOptions} onOpenChange={setShowPostOptions}>
        <DialogContent className="sm:max-w-lg bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Share Workout</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Workout Preview */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Workout Preview</h3>
              <div className="text-sm text-gray-300 space-y-1">
                <p><strong>Exercises:</strong> {workoutPlan.exercises.length}</p>
                <p><strong>Duration:</strong> ~{workoutPlan.estimatedDuration} minutes</p>
                <p><strong>Target:</strong> {selectedBodyParts.length > 0 ? 
                  selectedBodyParts.map(id => BODY_PARTS.find(bp => bp.id === id)?.name).join(", ") : 
                  "Full Body"
                }</p>
              </div>
            </div>

            {/* Post Details */}
            <div>
              <Label>Caption</Label>
              <Textarea
                placeholder="What's on your mind? Share your workout with the community..."
                value={workoutPlan.description}
                onChange={(e) => setWorkoutPlan(prev => ({ ...prev, description: e.target.value }))}
                className="bg-gray-700 border-gray-600 mt-2"
                rows={4}
              />
            </div>

            <div>
              <Label>Workout Name</Label>
              <Input
                placeholder="Name your workout..."
                value={workoutPlan.name}
                onChange={(e) => setWorkoutPlan(prev => ({ ...prev, name: e.target.value }))}
                className="bg-gray-700 border-gray-600 mt-2"
              />
            </div>

            {/* Exercise List */}
            <div>
              <Label>Exercises ({workoutPlan.exercises.length})</Label>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                {workoutPlan.exercises.map(exercise => (
                  <div key={exercise.id} className="flex justify-between items-center bg-gray-700 p-2 rounded text-sm">
                    <span>{exercise.name}</span>
                    <span className="text-gray-400">{exercise.targetSets || 3} sets × {exercise.targetReps || 10} reps</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPostOptions(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={async () => {
                  try {
                    const response = await fetch("/api/posts", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        type: "workout",
                        content: workoutPlan.description || `Check out my workout: ${workoutPlan.name || 'Custom Workout'}!`,
                        workoutData: {
                          name: workoutPlan.name || 'Custom Workout',
                          exercises: workoutPlan.exercises.map(ex => ({
                            name: ex.name,
                            sets: ex.targetSets || 3,
                            reps: ex.targetReps || 10,
                            muscleGroups: ex.muscleGroups
                          })),
                          duration: workoutPlan.estimatedDuration,
                          targetBodyParts: selectedBodyParts
                        }
                      }),
                    });

                    if (!response.ok) {
                      throw new Error("Failed to create post");
                    }

                    toast({
                      title: "Workout Shared!",
                      description: "Your workout has been posted to the community"
                    });
                    
                    setShowPostOptions(false);
                    setLocation("/");
                  } catch (error) {
                    toast({
                      title: "Share Failed",
                      description: "Failed to share workout. Please try again.",
                      variant: "destructive"
                    });
                  }
                }}
              >
                <Share className="h-4 w-4 mr-2" />
                Post Workout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}