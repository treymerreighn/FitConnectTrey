import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Play, Pause, SkipForward, Check, X, Timer, Weight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface WorkoutSet {
  id: string;
  reps: number;
  weight?: number;
  restTime?: number;
  completed: boolean;
  duration?: number;
}

interface WorkoutExercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  targetSets: number;
  targetReps: number;
  notes?: string;
  muscleGroups: string[];
  thumbnailUrl: string;
}

interface WorkoutSession {
  startTime: Date;
  exercises: WorkoutExercise[];
  currentExerciseIndex: number;
  currentSetIndex: number;
  isActive: boolean;
  totalDuration: number;
  showWeightsInPost: boolean;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function WorkoutSession() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [session, setSession] = useState<WorkoutSession>({
    startTime: new Date(),
    exercises: [],
    currentExerciseIndex: 0,
    currentSetIndex: 0,
    isActive: false,
    totalDuration: 0,
    showWeightsInPost: true
  });

  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [postCaption, setPostCaption] = useState("");

  // Initialize workout with selected exercises
  useEffect(() => {
    const exerciseIds = new URLSearchParams(window.location.search).get('exercises')?.split(',') || [];
    
    // Mock exercise data - replace with API call
    const mockExercises: WorkoutExercise[] = exerciseIds.map((id, index) => ({
      id,
      name: ["Trap Bar Deadlift", "Pull Up", "Overhead Squat", "Barbell Shrug"][index] || `Exercise ${id}`,
      targetSets: 3,
      targetReps: 8,
      muscleGroups: [["Hamstrings", "Glutes"], ["Lats", "Biceps"], ["Quadriceps", "Shoulders"], ["Traps"]][index] || ["Full Body"],
      thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
      sets: Array.from({ length: 3 }, (_, i) => ({
        id: `${id}-set-${i}`,
        reps: 0,
        weight: 0,
        completed: false,
        restTime: 60
      })),
      notes: ""
    }));

    setSession(prev => ({
      ...prev,
      exercises: mockExercises
    }));
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (session.isActive) {
      interval = setInterval(() => {
        setSession(prev => ({
          ...prev,
          totalDuration: prev.totalDuration + 1
        }));
      }, 1000);
    }

    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => prev - 1);
      }, 1000);
    } else if (restTimer === 0 && isResting) {
      setIsResting(false);
      toast({
        title: "Rest Complete!",
        description: "Ready for your next set"
      });
    }

    return () => clearInterval(interval);
  }, [session.isActive, isResting, restTimer]);

  const startWorkout = () => {
    setSession(prev => ({
      ...prev,
      isActive: true,
      startTime: new Date()
    }));
  };

  const pauseWorkout = () => {
    setSession(prev => ({
      ...prev,
      isActive: false
    }));
  };

  const completeSet = (exerciseIndex: number, setIndex: number, reps: number, weight?: number) => {
    setSession(prev => {
      const newExercises = [...prev.exercises];
      newExercises[exerciseIndex].sets[setIndex] = {
        ...newExercises[exerciseIndex].sets[setIndex],
        reps,
        weight,
        completed: true,
        duration: Math.floor(Math.random() * 60) + 30 // Mock duration
      };

      return {
        ...prev,
        exercises: newExercises
      };
    });

    // Start rest timer
    const restTime = session.exercises[exerciseIndex].sets[setIndex].restTime || 60;
    setRestTimer(restTime);
    setIsResting(true);
  };

  const skipToNextExercise = () => {
    setSession(prev => ({
      ...prev,
      currentExerciseIndex: Math.min(prev.currentExerciseIndex + 1, prev.exercises.length - 1),
      currentSetIndex: 0
    }));
  };

  const finishWorkout = () => {
    setSession(prev => ({ ...prev, isActive: false }));
    setShowFinishModal(true);
  };

  const postWorkout = async () => {
    const workoutData = {
      type: "workout",
      caption: postCaption || generateWorkoutSummary(),
      exercises: session.exercises,
      duration: session.totalDuration,
      showWeights: session.showWeightsInPost,
      completedAt: new Date().toISOString()
    };

    try {
      // Post to social feed - replace with actual API call
      toast({
        title: "Workout Posted!",
        description: "Your workout has been shared with your followers"
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Post Failed",
        description: "Failed to share workout",
        variant: "destructive"
      });
    }
  };

  const generateWorkoutSummary = () => {
    const totalSets = session.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0);
    const totalVolume = session.exercises.reduce((acc, ex) => 
      acc + ex.sets.filter(s => s.completed).reduce((vol, set) => vol + (set.reps * (set.weight || 0)), 0), 0
    );
    
    return `Completed ${session.exercises.length} exercises, ${totalSets} sets in ${formatTime(session.totalDuration)}. Total volume: ${totalVolume}lb`;
  };

  const currentExercise = session.exercises[session.currentExerciseIndex];
  const completedSets = currentExercise?.sets.filter(s => s.completed).length || 0;

  if (!currentExercise) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No exercises selected</p>
          <Button onClick={() => setLocation("/exercise-library")}>
            Select Exercises
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 p-4 z-10">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="text-red-500"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <div className="text-center">
            <div className="text-2xl font-bold">{formatTime(session.totalDuration)}</div>
            <div className="text-sm text-gray-400">
              {session.currentExerciseIndex + 1} of {session.exercises.length} exercises
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={session.isActive ? pauseWorkout : startWorkout}
            className="text-green-500"
          >
            {session.isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Rest Timer */}
      {isResting && (
        <div className="bg-blue-600 p-4 text-center">
          <div className="text-lg font-bold">Rest: {formatTime(restTimer)}</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsResting(false)}
            className="text-white mt-2"
          >
            Skip Rest
          </Button>
        </div>
      )}

      {/* Current Exercise */}
      <div className="p-4">
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div>
                <h2 className="text-xl">{currentExercise.name}</h2>
                <div className="flex space-x-2 mt-2">
                  {currentExercise.muscleGroups.map(muscle => (
                    <Badge key={muscle} variant="secondary" className="text-xs">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700">
                <img 
                  src={currentExercise.thumbnailUrl} 
                  alt={currentExercise.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-white">
                {completedSets}/{currentExercise.targetSets}
              </div>
              <div className="text-gray-400">Sets Completed</div>
            </div>
          </CardContent>
        </Card>

        {/* Sets */}
        <div className="space-y-4">
          {currentExercise.sets.map((set, setIndex) => (
            <SetCard
              key={set.id}
              set={set}
              setIndex={setIndex}
              exerciseIndex={session.currentExerciseIndex}
              targetReps={currentExercise.targetReps}
              onComplete={completeSet}
              isActive={setIndex === completedSets && !set.completed}
            />
          ))}
        </div>

        {/* Exercise Navigation */}
        <div className="flex space-x-4 mt-6">
          <Button
            onClick={skipToNextExercise}
            disabled={session.currentExerciseIndex >= session.exercises.length - 1}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Next Exercise
          </Button>
          
          <Button
            onClick={finishWorkout}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Finish Workout
          </Button>
        </div>
      </div>

      {/* Finish Workout Modal */}
      <Dialog open={showFinishModal} onOpenChange={setShowFinishModal}>
        <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Workout Complete! 🎉</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{session.exercises.length}</div>
                <div className="text-xs text-gray-400">Exercises</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{formatTime(session.totalDuration)}</div>
                <div className="text-xs text-gray-400">Duration</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {session.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0)}
                </div>
                <div className="text-xs text-gray-400">Sets</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Post Caption</Label>
              <Textarea
                placeholder={generateWorkoutSummary()}
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                className="bg-gray-700 border-gray-600"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={session.showWeightsInPost}
                onCheckedChange={(checked) => 
                  setSession(prev => ({ ...prev, showWeightsInPost: checked as boolean }))
                }
              />
              <Label>Show weights used in post</Label>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="flex-1"
              >
                Save Only
              </Button>
              <Button
                onClick={postWorkout}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Post Workout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Set Card Component
interface SetCardProps {
  set: WorkoutSet;
  setIndex: number;
  exerciseIndex: number;
  targetReps: number;
  onComplete: (exerciseIndex: number, setIndex: number, reps: number, weight?: number) => void;
  isActive: boolean;
}

function SetCard({ set, setIndex, exerciseIndex, targetReps, onComplete, isActive }: SetCardProps) {
  const [reps, setReps] = useState(set.reps || targetReps);
  const [weight, setWeight] = useState(set.weight || 0);

  const handleComplete = () => {
    onComplete(exerciseIndex, setIndex, reps, weight);
  };

  return (
    <Card className={`${
      set.completed ? 'bg-green-900/30 border-green-600' : 
      isActive ? 'bg-blue-900/30 border-blue-600' : 
      'bg-gray-800 border-gray-700'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-white">
            Set {setIndex + 1}
          </div>
          
          {set.completed && (
            <Badge className="bg-green-600">
              <Check className="h-3 w-3 mr-1" />
              Done
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <Label className="text-xs text-gray-400">REPS</Label>
            <Input
              type="number"
              value={reps}
              onChange={(e) => setReps(Number(e.target.value))}
              disabled={set.completed}
              className="text-center bg-gray-700 border-gray-600 text-white"
            />
          </div>
          
          <div>
            <Label className="text-xs text-gray-400">WEIGHT (LB)</Label>
            <Input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              disabled={set.completed}
              className="text-center bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div className="flex items-end">
            {!set.completed ? (
              <Button
                onClick={handleComplete}
                disabled={!isActive}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  // Allow editing completed sets
                  const newSet = { ...set, completed: false };
                  onComplete(exerciseIndex, setIndex, reps, weight);
                }}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {set.completed && (
          <div className="mt-2 text-xs text-gray-400 text-center">
            Completed: {set.reps} reps × {set.weight}lb
          </div>
        )}
      </CardContent>
    </Card>
  );
}