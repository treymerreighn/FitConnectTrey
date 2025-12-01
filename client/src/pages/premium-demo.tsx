import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ExerciseStatsPremium } from "@/components/exercise-stats-premium";
import { CURRENT_USER_ID } from "@/lib/constants";
import { Crown, Sparkles, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function PremiumDemo() {
  const [exerciseName, setExerciseName] = useState("Bench Press");
  const [isPremium, setIsPremium] = useState(() => {
    return localStorage.getItem('fitconnect-mock-premium') === 'true';
  });
  const [suggestedWeight, setSuggestedWeight] = useState<number | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleLoadWeight = (weight: number) => {
    setSuggestedWeight(weight);
    toast({
      title: "Weight Auto-Loaded!",
      description: `${weight} lbs loaded. This would pre-fill all weight inputs in a real workout.`,
    });
  };

  const togglePremium = (checked: boolean) => {
    setIsPremium(checked);
    localStorage.setItem('fitconnect-mock-premium', String(checked));
  };

  const seedWorkoutHistory = async () => {
    setIsSeeding(true);
    try {
      console.log('🌱 Attempting to seed workout history...');
      const response = await fetch('/api/dev/seed-workout-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: CURRENT_USER_ID }),
        credentials: 'include'
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Failed to seed data: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Seed response:', data);
      
      // Invalidate exercise history queries to refetch with new data
      queryClient.invalidateQueries({ queryKey: ['exercise-history'] });
      
      toast({
        title: "Workout History Seeded! 🎉",
        description: `Added ${data.count} sample workouts. Try "Bench Press", "Squat", or "Deadlift".`,
      });
    } catch (error) {
      console.error('❌ Seed error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to seed workout history",
        variant: "destructive"
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Premium Features Demo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-300 mb-1">
                    <Database className="inline h-4 w-4 mr-1" />
                    Need Sample Data?
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Click below to add 4 sample workouts with progressive overload for Bench Press, Squat, and Deadlift.
                  </p>
                </div>
                <Button 
                  onClick={seedWorkoutHistory}
                  disabled={isSeeding}
                  size="sm"
                  className="shrink-0"
                >
                  {isSeeding ? "Seeding..." : "Seed Data"}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-amber-500" />
                <div>
                  <Label htmlFor="premium-toggle" className="font-medium text-gray-900 dark:text-white">
                    Premium Mode
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Toggle to see free vs premium features
                  </p>
                </div>
              </div>
              <Switch
                id="premium-toggle"
                checked={isPremium}
                onCheckedChange={togglePremium}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exercise-name">Exercise Name</Label>
              <Input
                id="exercise-name"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                placeholder="e.g., Bench Press, Squat, Deadlift"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Try: "Bench Press", "Squat", "Deadlift", "Bulgarian Split Squat", "Dumbbell Shoulder Press"
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feature Comparison */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Free Version */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              Free User View
            </h3>
            <ExerciseStatsPremium
              exerciseName={exerciseName}
              userId={CURRENT_USER_ID}
              isPremium={false}
              showHistory={true}
            />
          </div>

          {/* Premium Version */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Premium User View
            </h3>
            <ExerciseStatsPremium
              exerciseName={exerciseName}
              userId={CURRENT_USER_ID}
              isPremium={true}
              onLoadWeight={handleLoadWeight}
              showHistory={true}
            />
          </div>
        </div>

        {/* What You're Currently Seeing */}
        <Card className={isPremium ? "border-2 border-amber-500" : "border-gray-200 dark:border-gray-800"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isPremium && <Crown className="h-5 w-5 text-amber-500" />}
              You're Currently Viewing: {isPremium ? "Premium" : "Free"} Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm space-y-2">
                <p className="font-medium text-gray-900 dark:text-white">
                  {isPremium ? "Premium Features Active:" : "Free Features:"}
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                  <li>✅ View total workout count</li>
                  <li>✅ See total sets performed</li>
                  <li>✅ View recent workout sessions</li>
                  {isPremium ? (
                    <>
                      <li className="text-amber-600 dark:text-amber-400">✨ Best performance tracking (weight × reps)</li>
                      <li className="text-amber-600 dark:text-amber-400">💪 Projected 1RM calculation</li>
                      <li className="text-amber-600 dark:text-amber-400">🎯 Auto-load recommended weights</li>
                      <li className="text-amber-600 dark:text-amber-400">📊 Premium styling and badges</li>
                    </>
                  ) : (
                    <>
                      <li className="text-gray-400 line-through">Best performance tracking</li>
                      <li className="text-gray-400 line-through">Projected 1RM calculation</li>
                      <li className="text-gray-400 line-through">Auto-load recommended weights</li>
                    </>
                  )}
                </ul>
              </div>

              {suggestedWeight && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm font-medium text-green-900 dark:text-green-300">
                    ✅ Auto-loaded {suggestedWeight} lbs
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    In a real workout, this would pre-fill all weight inputs with this recommended value.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-xs text-gray-500">
                  <strong>Note:</strong> This demo shows both versions side-by-side. In the real app, 
                  users will only see their subscription tier's features.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Implementation Details */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">1. Exercise History API</p>
                <code className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded block">
                  GET /api/users/:userId/exercise-history/:exerciseName
                </code>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Analyzes all your workout posts to extract performance data for specific exercises.
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">2. 1RM Calculation (Brzycki Formula)</p>
                <code className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded block">
                  1RM = Weight × (36 / (37 - Reps))
                </code>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Pure math, zero API costs. Accurate for 1-10 rep ranges.
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">3. Smart Weight Recommendations</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Suggests 90% of your previous best performance, or 80% of estimated 1RM for hypertrophy training.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
