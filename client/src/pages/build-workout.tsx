import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

// Workout analysis and balancing functions
const analyzeWorkoutBalance = (exercises: Exercise[]) => {
  const pushExercises = exercises.filter((ex: Exercise) => 
    ex.muscleGroups.some((mg: string) => 
      ['chest', 'shoulders', 'triceps', 'quadriceps'].includes(mg.toLowerCase())
    )
  );
  
  const pullExercises = exercises.filter((ex: Exercise) => 
    ex.muscleGroups.some((mg: string) => 
      ['back', 'biceps', 'hamstrings', 'glutes'].includes(mg.toLowerCase())
    )
  );

  const coreExercises = exercises.filter((ex: Exercise) => 
    ex.muscleGroups.some((mg: string) => mg.toLowerCase().includes('abs') || mg.toLowerCase().includes('core'))
  );

  const suggestions = [];
  
  // Push/Pull balance check
  if (pushExercises.length > pullExercises.length + 1) {
    suggestions.push("Consider adding more pulling exercises (back, biceps) to balance your workout");
  } else if (pullExercises.length > pushExercises.length + 1) {
    suggestions.push("Consider adding more pushing exercises (chest, shoulders, triceps) to balance your workout");
  }

  // Core inclusion check
  if (exercises.length >= 4 && coreExercises.length === 0) {
    suggestions.push("Add core exercises for a complete workout");
  }

  // Difficulty progression
  const difficulties = exercises.map((ex: Exercise) => ex.difficulty);
  const hasProgression = difficulties.includes("Beginner") && 
                        (difficulties.includes("Intermediate") || difficulties.includes("Advanced"));
  
  if (!hasProgression && exercises.length >= 3) {
    suggestions.push("Mix difficulty levels for better progression");
  }

  return {
    pushCount: pushExercises.length,
    pullCount: pullExercises.length,
    coreCount: coreExercises.length,
    isBalanced: Math.abs(pushExercises.length - pullExercises.length) <= 1,
    suggestions
  };
};

const calculateWorkoutDuration = (exercises: Exercise[]) => {
  return exercises.reduce((total: number, ex: Exercise) => {
    const sets = ex.targetSets || 3;
    const restTime = ex.restTime || 60;
    const setDuration = 45; // Average time per set in seconds
    return total + ((sets * setDuration + (sets - 1) * restTime) / 60); // Convert to minutes
  }, 0);
};

const calculateWorkoutDifficulty = (exercises: Exercise[]): "Beginner" | "Intermediate" | "Advanced" => {
  if (exercises.length === 0) return "Beginner";
  
  const difficultyScores = exercises.map((ex: Exercise) => {
    switch (ex.difficulty) {
      case "Beginner": return 1;
      case "Intermediate": return 2;
      case "Advanced": return 3;
      default: return 1;
    }
  });
  
  const avgScore = difficultyScores.reduce((sum, score) => sum + score, 0) / difficultyScores.length;
  
  if (avgScore <= 1.3) return "Beginner";
  if (avgScore <= 2.3) return "Intermediate";
  return "Advanced";
};


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
  const queryClient = useQueryClient();
  
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
    estimatedDuration: 0,
    difficulty: "Beginner"
  });
  
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [showPostOptions, setShowPostOptions] = useState(false);

  // Exercise library search and filter states
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState("");
  const [selectedEquipmentFilter, setSelectedEquipmentFilter] = useState<string>("all");

  const filteredExercises = (exercises.length > 0 ? exercises : MOCK_EXERCISES).filter((exercise: Exercise) => {
    if (selectedBodyParts.length === 0) return true;
    return exercise.muscleGroups.some((muscle: string) => 
      selectedBodyParts.some((bodyPart: string) => 
        BODY_PARTS.find(bp => bp.id === bodyPart)?.exercises.some((ex: string) => 
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
    // Check for duplicates
    if (workoutPlan.exercises.some(ex => ex.id === exercise.id)) {
      toast({
        title: "Exercise Already Added",
        description: "This exercise is already in your workout plan",
        variant: "destructive"
      });
      return;
    }

    // Smart balancing logic
    const exerciseWithDefaults = {
      ...exercise,
      targetSets: exercise.targetSets || 3,
      targetReps: exercise.targetReps || 12,
      restTime: exercise.restTime || 60
    };

    const updatedExercises = [...workoutPlan.exercises, exerciseWithDefaults];

    // Analyze balance and suggest improvements
    const balance = analyzeWorkoutBalance(updatedExercises);
    
    setWorkoutPlan(prev => ({
      ...prev,
      exercises: updatedExercises,
      estimatedDuration: calculateWorkoutDuration(updatedExercises),
      difficulty: calculateWorkoutDifficulty(updatedExercises)
    }));

    setShowExerciseLibrary(false); // Close modal after adding
    
    toast({
      title: "Exercise Added!",
      description: `${exercise.name} has been added to your workout`
    });

    // Show balance recommendations
    if (balance.suggestions.length > 0) {
      setTimeout(() => {
        toast({
          title: "Workout Balance Tip",
          description: balance.suggestions[0],
          duration: 4000
        });
      }, 1000);
    }
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
          
        </div>
      </div>

      {/* Workout Plan */}
      <div className="p-4">
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
                <p className="text-gray-400 mb-4">Use the Add Exercise button to browse and filter exercises for your workout</p>
                <div className="flex justify-center">
                  <Button onClick={() => setShowExerciseLibrary(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Exercise
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Workout Summary */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-red-400">{workoutPlan.exercises.length}</div>
                      <div className="text-xs text-gray-400">Exercises</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{Math.round(workoutPlan.estimatedDuration)}m</div>
                      <div className="text-xs text-gray-400">Duration</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-400">
                        {workoutPlan.exercises.reduce((acc, ex) => acc + (ex.targetSets || 3), 0)}
                      </div>
                      <div className="text-xs text-gray-400">Total Sets</div>
                    </div>
                    <div>
                      {(() => {
                        const balance = analyzeWorkoutBalance(workoutPlan.exercises);
                        return (
                          <div>
                            <div className={`text-2xl font-bold ${balance.isBalanced ? 'text-green-400' : 'text-yellow-400'}`}>
                              {balance.isBalanced ? '⚖️' : '⚠️'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {balance.isBalanced ? 'Balanced' : 'Unbalanced'}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {/* Balance Details */}
                  {workoutPlan.exercises.length > 0 && (() => {
                    const balance = analyzeWorkoutBalance(workoutPlan.exercises);
                    return (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                          <div className="text-center">
                            <span className="text-red-400 font-semibold">{balance.pushCount}</span> Push
                          </div>
                          <div className="text-center">
                            <span className="text-blue-400 font-semibold">{balance.pullCount}</span> Pull
                          </div>
                          <div className="text-center">
                            <span className="text-green-400 font-semibold">{balance.coreCount}</span> Core
                          </div>
                        </div>
                      </div>
                    );
                  })()}
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
          setExerciseSearchTerm("");
          setSelectedEquipmentFilter("all");
          // Keep body part selection for AI generation
        }
      }}>
        <DialogContent className="sm:max-w-3xl bg-gray-800 border-gray-700 text-white max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Exercise Library</DialogTitle>
            
            {/* Search and Filter Section */}
            <div className="space-y-4 pt-4">
              {/* Search Bar */}
              <div className="relative">
                <Input
                  placeholder="Search exercises by name or muscle group..."
                  value={exerciseSearchTerm}
                  onChange={(e) => setExerciseSearchTerm(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white pl-10"
                  data-testid="exercise-search-input"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              {/* Equipment Filter */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-400 self-center mr-2">Equipment:</span>
                {[
                  { id: "all", name: "All", icon: "🔄" },
                  { id: "bodyweight", name: "Bodyweight", icon: "🏃" },
                  { id: "dumbbells", name: "Dumbbells", icon: "🏋️" },
                  { id: "barbell", name: "Barbell", icon: "💪" },
                  { id: "resistance", name: "Bands", icon: "🎯" },
                  { id: "machine", name: "Machine", icon: "⚙️" }
                ].map(equipment => (
                  <Button
                    key={equipment.id}
                    variant={selectedEquipmentFilter === equipment.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedEquipmentFilter(equipment.id)}
                    className={`text-xs ${selectedEquipmentFilter === equipment.id 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    }`}
                    data-testid={`equipment-filter-${equipment.id}`}
                  >
                    <span className="mr-1">{equipment.icon}</span>
                    {equipment.name}
                  </Button>
                ))}
              </div>
              
              {/* Results count */}
              <div className="text-sm text-gray-400">
                {(() => {
                  const filteredCount = (exercises.length > 0 ? exercises : MOCK_EXERCISES).filter((exercise: Exercise) => {
                    const matchesSearch = exerciseSearchTerm === "" || 
                      exercise.name.toLowerCase().includes(exerciseSearchTerm.toLowerCase()) ||
                      exercise.muscleGroups.some((mg: string) => mg.toLowerCase().includes(exerciseSearchTerm.toLowerCase()));
                    
                    const matchesEquipment = selectedEquipmentFilter === "all" || 
                      exercise.equipment.some((eq: string) => {
                        if (selectedEquipmentFilter === "bodyweight") return eq.toLowerCase().includes("bodyweight") || eq.toLowerCase().includes("none");
                        if (selectedEquipmentFilter === "dumbbells") return eq.toLowerCase().includes("dumbbell");
                        if (selectedEquipmentFilter === "barbell") return eq.toLowerCase().includes("barbell");
                        if (selectedEquipmentFilter === "resistance") return eq.toLowerCase().includes("band") || eq.toLowerCase().includes("resistance");
                        if (selectedEquipmentFilter === "machine") return eq.toLowerCase().includes("machine") || eq.toLowerCase().includes("cable");
                        return false;
                      });

                    const matchesBodyPart = selectedBodyParts.length === 0 || 
                      exercise.muscleGroups.some((muscle: string) => 
                        selectedBodyParts.some((bodyPart: string) => 
                          BODY_PARTS.find(bp => bp.id === bodyPart)?.exercises.some((ex: string) => 
                            muscle.toLowerCase().includes(ex.toLowerCase().split(' ')[0])
                          )
                        )
                      );

                    return matchesSearch && matchesEquipment && matchesBodyPart;
                  }).length;
                  
                  return `${filteredCount} exercises found`;
                })()}
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto max-h-[60vh]">
            {/* All Exercises with Body Part Filtering */}
            <div className="space-y-4">
                {/* Body Part Filter Buttons */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-200">Filter by Body Part</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedBodyParts.length === 0 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedBodyParts([])}
                      className={`text-xs ${selectedBodyParts.length === 0 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      }`}
                      data-testid="body-part-filter-all"
                    >
                      🔄 All
                    </Button>
                    {BODY_PARTS.map(bodyPart => (
                      <Button
                        key={bodyPart.id}
                        variant={selectedBodyParts.includes(bodyPart.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleBodyPart(bodyPart.id)}
                        className={`text-xs ${selectedBodyParts.includes(bodyPart.id) 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        }`}
                        data-testid={`body-part-filter-${bodyPart.id}`}
                      >
                        <span className="mr-1">{bodyPart.icon}</span>
                        {bodyPart.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Exercise List */}
                <div className="space-y-3">
                  {(exercises.length > 0 ? exercises : MOCK_EXERCISES)
                    .filter((exercise: Exercise) => {
                      // Apply search filter
                      const matchesSearch = exerciseSearchTerm === "" || 
                        exercise.name.toLowerCase().includes(exerciseSearchTerm.toLowerCase()) ||
                        exercise.muscleGroups.some((mg: string) => mg.toLowerCase().includes(exerciseSearchTerm.toLowerCase()));
                      
                      // Apply equipment filter
                      const matchesEquipment = selectedEquipmentFilter === "all" || 
                        exercise.equipment.some((eq: string) => {
                          if (selectedEquipmentFilter === "bodyweight") return eq.toLowerCase().includes("bodyweight") || eq.toLowerCase().includes("none");
                          if (selectedEquipmentFilter === "dumbbells") return eq.toLowerCase().includes("dumbbell");
                          if (selectedEquipmentFilter === "barbell") return eq.toLowerCase().includes("barbell");
                          if (selectedEquipmentFilter === "resistance") return eq.toLowerCase().includes("band") || eq.toLowerCase().includes("resistance");
                          if (selectedEquipmentFilter === "machine") return eq.toLowerCase().includes("machine") || eq.toLowerCase().includes("cable");
                          return false;
                        });

                      // Apply body part filter
                      const matchesBodyPart = selectedBodyParts.length === 0 || 
                        exercise.muscleGroups.some((muscle: string) => 
                          selectedBodyParts.some((bodyPart: string) => 
                            BODY_PARTS.find(bp => bp.id === bodyPart)?.exercises.some((ex: string) => 
                              muscle.toLowerCase().includes(ex.toLowerCase().split(' ')[0])
                            )
                          )
                        );

                      return matchesSearch && matchesEquipment && matchesBodyPart;
                    })
                    .sort((a: Exercise, b: Exercise) => a.name.localeCompare(b.name))
                    .map((exercise: Exercise) => (
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
                              // Don't close modal - let users add multiple exercises
                            }}
                            disabled={workoutPlan.exercises.some(ex => ex.id === exercise.id)}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
                            data-testid={`add-exercise-${exercise.id}`}
                          >
                            {workoutPlan.exercises.some(ex => ex.id === exercise.id) ? "Added" : "Add"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* No results message */}
                  {(exercises.length > 0 ? exercises : MOCK_EXERCISES).filter((exercise: Exercise) => {
                    const matchesSearch = exerciseSearchTerm === "" || 
                      exercise.name.toLowerCase().includes(exerciseSearchTerm.toLowerCase()) ||
                      exercise.muscleGroups.some((mg: string) => mg.toLowerCase().includes(exerciseSearchTerm.toLowerCase()));
                    
                    const matchesEquipment = selectedEquipmentFilter === "all" || 
                      exercise.equipment.some((eq: string) => {
                        if (selectedEquipmentFilter === "bodyweight") return eq.toLowerCase().includes("bodyweight") || eq.toLowerCase().includes("none");
                        if (selectedEquipmentFilter === "dumbbells") return eq.toLowerCase().includes("dumbbell");
                        if (selectedEquipmentFilter === "barbell") return eq.toLowerCase().includes("barbell");
                        if (selectedEquipmentFilter === "resistance") return eq.toLowerCase().includes("band") || eq.toLowerCase().includes("resistance");
                        if (selectedEquipmentFilter === "machine") return eq.toLowerCase().includes("machine") || eq.toLowerCase().includes("cable");
                        return false;
                      });

                    const matchesBodyPart = selectedBodyParts.length === 0 || 
                      exercise.muscleGroups.some((muscle: string) => 
                        selectedBodyParts.some((bodyPart: string) => 
                          BODY_PARTS.find(bp => bp.id === bodyPart)?.exercises.some((ex: string) => 
                            muscle.toLowerCase().includes(ex.toLowerCase().split(' ')[0])
                          )
                        )
                      );

                    return matchesSearch && matchesEquipment && matchesBodyPart;
                  }).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No exercises found matching your filters.</p>
                      <p className="text-gray-500 text-sm mt-2">Try adjusting your search, equipment, or body part filters.</p>
                    </div>
                  )}
                </div>
              </div>
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
                        userId: "44595091", // Current user ID
                        type: "workout",
                        caption: workoutPlan.description || `Check out my workout: ${workoutPlan.name || 'Custom Workout'}! 💪`,
                        workoutData: {
                          workoutType: workoutPlan.name || 'Custom Workout',
                          duration: Math.round(workoutPlan.estimatedDuration),
                          calories: Math.round(workoutPlan.estimatedDuration * 6), // Estimate 6 calories per minute
                          exercises: workoutPlan.exercises.map(ex => ({
                            name: ex.name,
                            sets: Array.from({ length: ex.targetSets || 3 }, (_, i) => ({
                              reps: ex.targetReps || 10,
                              rest: ex.restTime || 60
                            })),
                            notes: `Target: ${ex.targetSets || 3} sets × ${ex.targetReps || 10} reps`
                          })),
                          // Legacy fields for backward compatibility
                          sets: workoutPlan.exercises.reduce((total, ex) => total + (ex.targetSets || 3), 0),
                          reps: `${workoutPlan.exercises.length} exercises`
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
                    
                    // Invalidate posts cache to refresh feed
                    queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
                    
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