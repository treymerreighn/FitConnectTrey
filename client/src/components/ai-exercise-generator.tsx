import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Dumbbell, Target, Zap, Activity } from "lucide-react";

interface ExerciseGeneratorProps {
  onClose?: () => void;
}

const categories = [
  { value: "strength", label: "Strength Training", icon: "💪" },
  { value: "cardio", label: "Cardio", icon: "🏃‍♂️" },
  { value: "flexibility", label: "Flexibility", icon: "🧘‍♀️" },
  { value: "sports", label: "Sports", icon: "⚽" },
  { value: "functional", label: "Functional", icon: "🏋️‍♀️" }
];

const muscleGroups = [
  "chest", "back", "shoulders", "biceps", "triceps", "forearms",
  "abs", "obliques", "lower_back", "glutes", "quadriceps", 
  "hamstrings", "calves", "traps", "lats", "delts"
];

const equipmentOptions = [
  "none", "dumbbells", "barbell", "resistance-bands", "pull-up-bar",
  "kettlebell", "cable-machine", "medicine-ball", "box", "suspension-trainer"
];

const difficulties = [
  { value: "beginner", label: "Beginner", color: "bg-green-500" },
  { value: "intermediate", label: "Intermediate", color: "bg-yellow-500" },
  { value: "advanced", label: "Advanced", color: "bg-red-500" }
];

export function AIExerciseGenerator({ onClose }: ExerciseGeneratorProps) {
  const [exerciseName, setExerciseName] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [generatedExercise, setGeneratedExercise] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateBatchMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/generate-exercises-with-diagrams", { method: "POST" });
      return await res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success! 🎉",
        description: data?.message || "Generated popular exercises with muscle diagrams",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error?.message || "Failed to generate exercises",
        variant: "destructive",
      });
    }
  });

  const generateCustomMutation = useMutation({
    mutationFn: async () => {
      if (!category || !difficulty || selectedMuscles.length === 0 || selectedEquipment.length === 0) {
        throw new Error("Please fill in all required fields");
      }
      const res = await apiRequest("/api/generate-custom-exercise", {
        method: "POST",
        body: {
          name: exerciseName || undefined,
          category,
          targetMuscles: selectedMuscles,
          equipment: selectedEquipment,
          difficulty
        }
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      setGeneratedExercise(data?.exercise);
      toast({
        title: "Exercise Generated! 🎯",
        description: data?.message || `Generated "${data?.exercise?.name}" with muscle diagram`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error?.message || "Failed to generate custom exercise",
        variant: "destructive",
      });
    }
  });

  const handleMuscleToggle = (muscle: string) => {
    setSelectedMuscles(prev => 
      prev.includes(muscle) 
        ? prev.filter(m => m !== muscle)
        : [...prev, muscle]
    );
  };

  const handleEquipmentToggle = (equipment: string) => {
    setSelectedEquipment(prev => 
      prev.includes(equipment) 
        ? prev.filter(e => e !== equipment)
        : [...prev, equipment]
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card className="bg-gradient-to-r from-fit-green/10 to-fit-blue/10 border-fit-green/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Brain className="w-6 h-6 text-fit-green" />
            AI Exercise Generator with Muscle Diagrams
          </CardTitle>
          <CardDescription>
            Generate custom exercises with detailed muscle activation diagrams powered by AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Generate Popular Exercises */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-fit-gold" />
              Quick Generate Popular Exercises
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Generate 8 popular exercises with muscle diagrams (Push-ups, Squats, Pull-ups, etc.)
            </p>
            <Button 
              onClick={() => generateBatchMutation.mutate()}
              disabled={generateBatchMutation.isPending}
              className="bg-fit-green hover:bg-fit-green/90 text-white"
            >
              {generateBatchMutation.isPending ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Generate Popular Exercises
                </>
              )}
            </Button>
          </div>

          {/* Custom Exercise Generator */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-fit-blue" />
              Custom Exercise Generator
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Exercise Name */}
              <div className="space-y-2">
                <Label htmlFor="exercise-name">Exercise Name (Optional)</Label>
                <Input
                  id="exercise-name"
                  placeholder="e.g., Diamond Push-ups"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <Label>Difficulty Level *</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map((diff) => (
                      <SelectItem key={diff.value} value={diff.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${diff.color}`} />
                          {diff.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Target Muscles */}
            <div className="space-y-2 mt-4">
              <Label>Target Muscle Groups * (Select 1-3 primary muscles)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {muscleGroups.map((muscle) => (
                  <div key={muscle} className="flex items-center space-x-2">
                    <Checkbox
                      id={muscle}
                      checked={selectedMuscles.includes(muscle)}
                      onCheckedChange={() => handleMuscleToggle(muscle)}
                    />
                    <Label htmlFor={muscle} className="text-sm capitalize">
                      {muscle.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedMuscles.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedMuscles.map((muscle) => (
                    <Badge key={muscle} variant="secondary" className="text-xs">
                      {muscle.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Equipment */}
            <div className="space-y-2 mt-4">
              <Label>Equipment * (Select equipment available)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {equipmentOptions.map((equipment) => (
                  <div key={equipment} className="flex items-center space-x-2">
                    <Checkbox
                      id={equipment}
                      checked={selectedEquipment.includes(equipment)}
                      onCheckedChange={() => handleEquipmentToggle(equipment)}
                    />
                    <Label htmlFor={equipment} className="text-sm capitalize">
                      {equipment.replace('-', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedEquipment.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedEquipment.map((equipment) => (
                    <Badge key={equipment} variant="secondary" className="text-xs">
                      {equipment.replace('-', ' ')}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Button 
              onClick={() => generateCustomMutation.mutate()}
              disabled={generateCustomMutation.isPending || !category || !difficulty || selectedMuscles.length === 0 || selectedEquipment.length === 0}
              className="w-full mt-6 bg-fit-blue hover:bg-fit-blue/90 text-white"
            >
              {generateCustomMutation.isPending ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Generating Custom Exercise...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Generate Custom Exercise with Muscle Diagram
                </>
              )}
            </Button>
          </div>

          {/* Generated Exercise Preview */}
          {generatedExercise && (
            <Card className="border-fit-green">
              <CardHeader>
                <CardTitle className="text-fit-green">
                  🎯 Generated: {generatedExercise.name}
                </CardTitle>
                <CardDescription>
                  {generatedExercise.anatomyDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Exercise Details */}
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Badge className="bg-fit-green text-white">
                        {generatedExercise.category}
                      </Badge>
                      <Badge variant="outline">
                        {generatedExercise.difficulty}
                      </Badge>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Instructions:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        {generatedExercise.instructions?.map((step: string, index: number) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Tips:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {generatedExercise.tips?.map((tip: string, index: number) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Sets:</span> {generatedExercise.targetSets}
                      </div>
                      <div>
                        <span className="font-medium">Reps:</span> {generatedExercise.targetReps}
                      </div>
                      <div>
                        <span className="font-medium">Rest:</span> {generatedExercise.restTime}s
                      </div>
                      <div>
                        <span className="font-medium">Calories/min:</span> {generatedExercise.caloriesBurnedPerMinute}
                      </div>
                    </div>
                  </div>

                  {/* Muscle Diagram */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Muscle Activation Diagram:</h4>
                    <div 
                      className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 flex items-center justify-center min-h-[300px]"
                      dangerouslySetInnerHTML={{ __html: generatedExercise.muscleDiagramSvg }}
                    />
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <p><span className="inline-block w-3 h-3 bg-red-500 rounded mr-2"></span>Primary Muscles</p>
                      <p><span className="inline-block w-3 h-3 bg-orange-500 rounded mr-2"></span>Secondary Muscles</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}