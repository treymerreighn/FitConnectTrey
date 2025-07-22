import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Play, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import { useLocation, Link } from "wouter";

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
  equipment: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  videoUrl: string;
  instructions: string[];
  tips: string[];
  thumbnailUrl: string;
}

const MOCK_EXERCISES: Exercise[] = [
  {
    id: "1",
    name: "1-Step Box Jump",
    category: "Cardio",
    muscleGroups: ["Quadriceps", "Glutes", "Calves"],
    equipment: ["Box"],
    difficulty: "Beginner",
    videoUrl: "/videos/box-jump.mp4",
    instructions: ["Stand in front of box", "Jump up explosively", "Land softly", "Step down"],
    tips: ["Keep knees soft on landing", "Start with lower box"],
    thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"
  },
  {
    id: "2", 
    name: "Trap Bar Deadlift",
    category: "Strength",
    muscleGroups: ["Hamstrings", "Glutes", "Back", "Traps"],
    equipment: ["Trap Bar", "Weight Plates"],
    difficulty: "Intermediate",
    videoUrl: "/videos/trap-bar-deadlift.mp4",
    instructions: ["Stand inside trap bar", "Grip handles", "Lift with legs and back", "Lower slowly"],
    tips: ["Keep back straight", "Drive through heels"],
    thumbnailUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400"
  },
  {
    id: "3",
    name: "Pull Up", 
    category: "Strength",
    muscleGroups: ["Lats", "Biceps", "Rhomboids"],
    equipment: ["Pull-up Bar"],
    difficulty: "Intermediate",
    videoUrl: "/videos/pull-up.mp4",
    instructions: ["Hang from bar", "Pull up until chin over bar", "Lower slowly"],
    tips: ["Full range of motion", "Control the descent"],
    thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"
  },
  {
    id: "4",
    name: "Overhead Squat",
    category: "Strength", 
    muscleGroups: ["Quadriceps", "Glutes", "Shoulders", "Core"],
    equipment: ["Barbell"],
    difficulty: "Advanced",
    videoUrl: "/videos/overhead-squat.mp4",
    instructions: ["Hold barbell overhead", "Squat down", "Keep arms locked", "Stand up"],
    tips: ["Maintain overhead position", "Good mobility required"],
    thumbnailUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400"
  },
  {
    id: "5",
    name: "Barbell Shrug",
    category: "Strength",
    muscleGroups: ["Traps", "Shoulders"],
    equipment: ["Barbell"],
    difficulty: "Beginner", 
    videoUrl: "/videos/barbell-shrug.mp4",
    instructions: ["Hold barbell at thighs", "Shrug shoulders up", "Hold briefly", "Lower slowly"],
    tips: ["Don't roll shoulders", "Focus on traps"],
    thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"
  }
];

export default function ExerciseLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showExerciseDetail, setShowExerciseDetail] = useState<Exercise | null>(null);
  const [, setLocation] = useLocation();

  // Mock data for now - replace with real API call
  const exercises = MOCK_EXERCISES;

  const categories = ["All", "Strength", "Cardio", "Flexibility", "Sports"];
  const muscleGroups = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core"];

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.muscleGroups.some(mg => mg.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExerciseSelection = (exercise: Exercise) => {
    setSelectedExercises(prev => {
      const isSelected = prev.some(e => e.id === exercise.id);
      if (isSelected) {
        return prev.filter(e => e.id !== exercise.id);
      } else {
        return [...prev, exercise];
      }
    });
  };

  const startWorkoutWithSelected = () => {
    if (selectedExercises.length > 0) {
      // Navigate to workout session with selected exercises
      setLocation(`/workout-session?exercises=${selectedExercises.map(e => e.id).join(',')}`);
    }
  };

  const groupedByLetter = filteredExercises.reduce((acc, exercise) => {
    const firstLetter = exercise.name[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 p-4 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-red-500"
            >
              <X className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">All Exercises</h1>
          </div>
          <Button
            variant={isSelectionMode ? "destructive" : "outline"}
            size="sm"
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              setSelectedExercises([]);
            }}
          >
            {isSelectionMode ? "Cancel" : "Select"}
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
          />
        </div>

        {/* Category Filter */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Selected Count & Start Workout */}
        {isSelectionMode && selectedExercises.length > 0 && (
          <div className="mt-4 flex items-center justify-between bg-red-600 rounded-lg p-3">
            <span className="font-medium">{selectedExercises.length} exercises selected</span>
            <Button
              onClick={startWorkoutWithSelected}
              className="bg-white text-red-600 hover:bg-gray-100"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Workout
            </Button>
          </div>
        )}
      </div>

      {/* Exercise List */}
      <div className="p-4 space-y-6">
        {Object.entries(groupedByLetter)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([letter, exercises]) => (
            <div key={letter}>
              <h2 className="text-lg font-bold text-gray-400 mb-3">{letter}</h2>
              <div className="space-y-3">
                {exercises.map(exercise => (
                  <Card 
                    key={exercise.id} 
                    className="bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-750 transition-colors"
                    onClick={() => isSelectionMode ? toggleExerciseSelection(exercise) : setShowExerciseDetail(exercise)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        {/* Exercise Image */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-700">
                          <img 
                            src={exercise.thumbnailUrl} 
                            alt={exercise.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Exercise Info */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{exercise.name}</h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {exercise.muscleGroups.slice(0, 2).map(muscle => (
                              <Badge key={muscle} variant="secondary" className="text-xs">
                                {muscle}
                              </Badge>
                            ))}
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                exercise.difficulty === 'Beginner' ? 'border-green-500 text-green-500' :
                                exercise.difficulty === 'Intermediate' ? 'border-yellow-500 text-yellow-500' :
                                'border-red-500 text-red-500'
                              }`}
                            >
                              {exercise.difficulty}
                            </Badge>
                          </div>
                        </div>

                        {/* Selection Checkbox */}
                        {isSelectionMode && (
                          <Checkbox
                            checked={selectedExercises.some(e => e.id === exercise.id)}
                            onChange={() => toggleExerciseSelection(exercise)}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* Add Exercise Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          size="lg"
          className="bg-red-600 hover:bg-red-700 rounded-full w-14 h-14 p-0 shadow-lg"
          onClick={() => setLocation("/add-exercise")}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Exercise Detail Modal */}
      {showExerciseDetail && (
        <Dialog open={!!showExerciseDetail} onOpenChange={() => setShowExerciseDetail(null)}>
          <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>{showExerciseDetail.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-700">
                <img 
                  src={showExerciseDetail.thumbnailUrl} 
                  alt={showExerciseDetail.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Muscle Groups</h4>
                <div className="flex flex-wrap gap-2">
                  {showExerciseDetail.muscleGroups.map(muscle => (
                    <Badge key={muscle} variant="secondary">{muscle}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Instructions</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                  {showExerciseDetail.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Tips</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                  {showExerciseDetail.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>

              <Button 
                onClick={() => {
                  setSelectedExercises([showExerciseDetail]);
                  setShowExerciseDetail(null);
                  setLocation(`/workout-session?exercises=${showExerciseDetail.id}`);
                }}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Workout with This Exercise
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}