import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  Timer, 
  User,
  MoreHorizontal,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  images?: string[];
  targetSets?: number;
  targetReps?: number;
  restTime?: number;
}

interface WorkoutSet {
  setNumber: number;
  targetReps: number;
  completedReps: number;
  weight: number;
  isCompleted: boolean;
  restTime: number;
}

interface WorkoutExercise extends Exercise {
  sets: WorkoutSet[];
  isCompleted: boolean;
  superset?: string;
}

export default function WorkoutSession() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Timer state
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  
  // Workout state
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  
  // Mock workout data - replace with actual data from URL params
  const mockWorkout: WorkoutExercise[] = [
    {
      id: "deadlift",
      name: "Trap Bar Deadlift",
      category: "strength",
      muscleGroups: ["hamstrings", "glutes", "back"],
      equipment: ["barbell"],
      difficulty: "Intermediate",
      thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
      instructions: [],
      sets: [
        { setNumber: 1, targetReps: 8, completedReps: 0, weight: 135, isCompleted: false, restTime: 120 },
        { setNumber: 2, targetReps: 8, completedReps: 0, weight: 155, isCompleted: false, restTime: 120 },
        { setNumber: 3, targetReps: 6, completedReps: 0, weight: 175, isCompleted: false, restTime: 120 },
        { setNumber: 4, targetReps: 4, completedReps: 0, weight: 185, isCompleted: false, restTime: 120 }
      ],
      isCompleted: false
    },
    {
      id: "chinup",
      name: "Chin Up",
      category: "strength",
      muscleGroups: ["lats", "biceps"],
      equipment: ["pullup-bar"],
      difficulty: "Intermediate",
      thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
      instructions: [],
      sets: [
        { setNumber: 1, targetReps: 5, completedReps: 0, weight: 0, isCompleted: false, restTime: 90 },
        { setNumber: 2, targetReps: 5, completedReps: 0, weight: 0, isCompleted: false, restTime: 90 },
        { setNumber: 3, targetReps: 5, completedReps: 0, weight: 0, isCompleted: false, restTime: 90 },
        { setNumber: 4, targetReps: 5, completedReps: 0, weight: 0, isCompleted: false, restTime: 90 }
      ],
      isCompleted: false,
      superset: "A"
    },
    {
      id: "toestobar",
      name: "Toes to Bar",
      category: "strength",
      muscleGroups: ["abs", "lats"],
      equipment: ["pullup-bar"],
      difficulty: "Advanced",
      thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
      instructions: [],
      sets: [
        { setNumber: 1, targetReps: 11, completedReps: 0, weight: 0, isCompleted: false, restTime: 90 },
        { setNumber: 2, targetReps: 11, completedReps: 0, weight: 0, isCompleted: false, restTime: 90 },
        { setNumber: 3, targetReps: 11, completedReps: 0, weight: 0, isCompleted: false, restTime: 90 },
        { setNumber: 4, targetReps: 11, completedReps: 0, weight: 0, isCompleted: false, restTime: 90 }
      ],
      isCompleted: false,
      superset: "A"
    },
    {
      id: "trapshrugs",
      name: "Trap Bar Shrugs",
      category: "strength",
      muscleGroups: ["traps"],
      equipment: ["barbell"],
      difficulty: "Beginner",
      thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
      instructions: [],
      sets: [
        { setNumber: 1, targetReps: 6, completedReps: 0, weight: 410, isCompleted: false, restTime: 90 },
        { setNumber: 2, targetReps: 6, completedReps: 0, weight: 410, isCompleted: false, restTime: 90 },
        { setNumber: 3, targetReps: 6, completedReps: 0, weight: 410, isCompleted: false, restTime: 90 }
      ],
      isCompleted: false,
      superset: "B"
    },
    {
      id: "diamondpushup",
      name: "Diamond Push Up",
      category: "strength",
      muscleGroups: ["chest", "triceps"],
      equipment: ["none"],
      difficulty: "Intermediate",
      thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
      instructions: [],
      sets: [
        { setNumber: 1, targetReps: 15, completedReps: 0, weight: 0, isCompleted: false, restTime: 90 },
        { setNumber: 2, targetReps: 15, completedReps: 0, weight: 0, isCompleted: false, restTime: 90 },
        { setNumber: 3, targetReps: 15, completedReps: 0, weight: 0, isCompleted: false, restTime: 90 }
      ],
      isCompleted: false,
      superset: "B"
    }
  ];

  useEffect(() => {
    setWorkoutExercises(mockWorkout);
  }, []);

  // Timer effects
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            toast({
              title: "Rest Complete!",
              description: "Time for your next set"
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer, toast]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const completeSet = (exerciseIndex: number, setIndex: number, reps: number) => {
    setWorkoutExercises(prev => {
      const updated = [...prev];
      updated[exerciseIndex].sets[setIndex] = {
        ...updated[exerciseIndex].sets[setIndex],
        completedReps: reps,
        isCompleted: true
      };
      
      // Check if exercise is completed
      const allSetsCompleted = updated[exerciseIndex].sets.every(set => set.isCompleted);
      if (allSetsCompleted) {
        updated[exerciseIndex].isCompleted = true;
      }
      
      return updated;
    });

    // Start rest timer
    const restTime = workoutExercises[exerciseIndex].sets[setIndex].restTime;
    setRestTimer(restTime);
    setIsResting(true);
  };

  const undoSet = (exerciseIndex: number, setIndex: number) => {
    setWorkoutExercises(prev => {
      const updated = [...prev];
      updated[exerciseIndex].sets[setIndex] = {
        ...updated[exerciseIndex].sets[setIndex],
        completedReps: 0,
        isCompleted: false
      };
      updated[exerciseIndex].isCompleted = false;
      return updated;
    });
  };

  const finishWorkout = () => {
    toast({
      title: "Workout Complete!",
      description: `Great job! You worked out for ${formatTime(elapsedTime)}`
    });
    setLocation("/");
  };

  // Group exercises by superset
  const groupedExercises = workoutExercises.reduce((acc, exercise, index) => {
    if (exercise.superset) {
      if (!acc[exercise.superset]) {
        acc[exercise.superset] = [];
      }
      acc[exercise.superset].push({ exercise, originalIndex: index });
    } else {
      acc[`single-${index}`] = [{ exercise, originalIndex: index }];
    }
    return acc;
  }, {} as Record<string, Array<{ exercise: WorkoutExercise; originalIndex: number }>>);

  const getSupersetRounds = (superset: string) => {
    const exercises = groupedExercises[superset];
    return exercises[0]?.exercise.sets.length || 0;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 p-4 z-50">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/build-workout")}
            className="text-red-400 hover:text-red-300"
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Timer Display */}
          <div className="flex flex-col items-center">
            <div className="text-2xl font-mono font-bold">
              {formatTime(elapsedTime)}
            </div>
            {isResting && (
              <div className="text-sm text-orange-400">
                Rest: {formatTime(restTimer)}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400"
            >
              <User className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Workout Content */}
      <div className="p-4 space-y-6 pb-24">
        {Object.entries(groupedExercises).map(([groupKey, exercises]) => {
          const isSuperset = !groupKey.startsWith('single-');
          const supersetLetter = isSuperset ? groupKey : null;
          const rounds = isSuperset ? getSupersetRounds(groupKey) : exercises[0].exercise.sets.length;

          return (
            <div key={groupKey} className="space-y-4">
              {isSuperset && (
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-300">
                    Superset • {rounds} Rounds
                  </h3>
                  <Button variant="ghost" size="sm" className="text-gray-400">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {exercises.map(({ exercise, originalIndex }) => (
                <Card key={exercise.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      {/* Exercise Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                        <img 
                          src={exercise.thumbnailUrl}
                          alt={exercise.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Exercise Info */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-semibold text-white">
                            {exercise.name}
                          </h4>
                          <Button variant="ghost" size="sm" className="text-gray-400">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="text-sm text-gray-400 mt-1">
                          {exercise.sets.length} sets
                          {exercise.sets[0]?.targetReps && ` • ${exercise.sets[0].targetReps} reps`}
                          {exercise.sets[0]?.weight > 0 && ` • ${exercise.sets[0].weight} lb`}
                        </div>

                        {/* Sets Display */}
                        <div className="mt-3 space-y-2">
                          {exercise.sets.map((set, setIndex) => (
                            <div 
                              key={setIndex}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                set.isCompleted 
                                  ? 'bg-green-900/20 border-green-500/30' 
                                  : 'bg-gray-700/50 border-gray-600'
                              }`}
                            >
                              <div className="flex items-center space-x-4">
                                <span className="text-sm font-medium text-gray-300">
                                  Set {set.setNumber}
                                </span>
                                <span className="text-sm text-gray-400">
                                  {set.targetReps} reps
                                </span>
                                {set.weight > 0 && (
                                  <span className="text-sm text-gray-400">
                                    {set.weight} lb
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center space-x-2">
                                {set.isCompleted ? (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-green-400">
                                      {set.completedReps} reps
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => undoSet(originalIndex, setIndex)}
                                      className="text-gray-400 hover:text-white"
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    onClick={() => completeSet(originalIndex, setIndex, set.targetReps)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    size="sm"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Complete
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        })}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 p-4">
        <div className="flex items-center justify-center">
          <Button
            onClick={finishWorkout}
            className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full"
            size="lg"
          >
            <div className="w-6 h-6 bg-white rounded-sm" />
          </Button>
        </div>
      </div>

      {/* Rest Timer Overlay */}
      {isResting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gray-800 border-gray-700 p-8 text-center">
            <div className="space-y-4">
              <Timer className="h-12 w-12 text-orange-400 mx-auto" />
              <h3 className="text-xl font-semibold">Rest Time</h3>
              <div className="text-3xl font-mono font-bold text-orange-400">
                {formatTime(restTimer)}
              </div>
              <Button
                onClick={() => {
                  setIsResting(false);
                  setRestTimer(0);
                }}
                variant="outline"
                className="mt-4"
              >
                Skip Rest
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}