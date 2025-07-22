import { useState } from "react";
import { useLocation } from "wouter";
import { Database, Zap, Download, Upload, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [isGeneratingExercises, setIsGeneratingExercises] = useState(false);
  const [isGeneratingTemplates, setIsGeneratingTemplates] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const seedExerciseDatabase = async () => {
    setIsGeneratingExercises(true);
    setGenerationProgress(0);

    try {
      const response = await fetch("/api/admin/seed-exercise-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to seed database");
      }

      // Simulate quick progress for seeding
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 20;
        });
      }, 200);

      // Complete after 2 seconds
      setTimeout(() => {
        setGenerationProgress(100);
        setIsGeneratingExercises(false);
        clearInterval(progressInterval);
        
        toast({
          title: "Exercise Library Populated!",
          description: "20 comprehensive exercises added to your library"
        });
      }, 2000);

    } catch (error) {
      setIsGeneratingExercises(false);
      toast({
        title: "Seeding Failed",
        description: "Failed to populate exercise database",
        variant: "destructive"
      });
    }
  };

  const generateAIExercises = async () => {
    setIsGeneratingExercises(true);
    setGenerationProgress(0);

    try {
      const response = await fetch("/api/admin/generate-exercise-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isAdmin: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to start generation");
      }

      // Simulate progress for UI feedback
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.random() * 10;
        });
      }, 2000);

      // Complete after 30 seconds (AI generation takes time)
      setTimeout(() => {
        setGenerationProgress(100);
        setIsGeneratingExercises(false);
        clearInterval(progressInterval);
        
        toast({
          title: "AI Exercise Database Generated!",
          description: "500+ AI-generated exercises have been added to the database"
        });
      }, 30000);

    } catch (error) {
      setIsGeneratingExercises(false);
      toast({
        title: "Generation Failed",
        description: "Failed to generate exercise database",
        variant: "destructive"
      });
    }
  };

  const generateWorkoutTemplates = async () => {
    setIsGeneratingTemplates(true);

    try {
      const response = await fetch("/api/admin/generate-workout-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isAdmin: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to start generation");
      }

      // Complete after 15 seconds
      setTimeout(() => {
        setIsGeneratingTemplates(false);
        toast({
          title: "Workout Templates Generated!",
          description: "Professional workout templates have been created"
        });
      }, 15000);

    } catch (error) {
      setIsGeneratingTemplates(false);
      toast({
        title: "Generation Failed",
        description: "Failed to generate workout templates",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Content Generation</h1>
          <p className="text-gray-400">Generate comprehensive exercise database and workout templates using AI</p>
        </div>

        {/* Generation Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Exercise Database Generation */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-6 w-6 mr-2 text-blue-400" />
                Exercise Database
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-400">
                Generate a comprehensive database of 500+ exercises across all categories and difficulty levels.
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Categories</span>
                  <Badge variant="secondary">5 Types</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Equipment Variations</span>
                  <Badge variant="secondary">10 Types</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Difficulty Levels</span>
                  <Badge variant="secondary">3 Levels</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Expected Exercises</span>
                  <Badge variant="secondary">500+</Badge>
                </div>
              </div>

              {isGeneratingExercises && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(generationProgress)}%</span>
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={seedExerciseDatabase}
                  disabled={isGeneratingExercises}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isGeneratingExercises ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Seeding... ({Math.round(generationProgress)}%)
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Quick Seed (20 Exercises)
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={generateAIExercises}
                  disabled={isGeneratingExercises}
                  variant="outline"
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  AI Generate (500+ Exercises)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Workout Templates Generation */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-6 w-6 mr-2 text-green-400" />
                Workout Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-400">
                Create professional workout templates for different goals and fitness levels.
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Template Types</span>
                  <Badge variant="secondary">10 Types</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Difficulty Levels</span>
                  <Badge variant="secondary">All Levels</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Duration Range</span>
                  <Badge variant="secondary">25-60 min</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Body Part Focus</span>
                  <Badge variant="secondary">Full Coverage</Badge>
                </div>
              </div>

              <Button
                onClick={generateWorkoutTemplates}
                disabled={isGeneratingTemplates}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isGeneratingTemplates ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Templates...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Workout Templates
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Information */}
        <div className="mt-8 space-y-4">
          <Alert className="border-blue-500/50 bg-blue-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Exercise Database Generation:</strong> Creates exercises for all categories (Strength, Cardio, Flexibility, Sports, Functional) 
              with multiple equipment types and difficulty levels. Each exercise includes detailed instructions, tips, and variations.
            </AlertDescription>
          </Alert>

          <Alert className="border-green-500/50 bg-green-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Workout Templates:</strong> Generates professional workout plans including Full Body, Upper/Lower splits, 
              HIIT cardio, and specialized training. Each template includes warm-up, main workout, and cool-down phases.
            </AlertDescription>
          </Alert>

          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Generation Time:</strong> Exercise database generation takes 2-3 minutes to complete due to API rate limits. 
              Workout templates take about 30 seconds. The process runs in the background.
            </AlertDescription>
          </Alert>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <Button
            variant="outline"
            onClick={() => setLocation("/workouts")}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Back to Workouts
          </Button>
        </div>
      </div>
    </div>
  );
}