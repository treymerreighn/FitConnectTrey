import { useEffect } from "react";
import { useLocation } from "wouter";
import { sampleLegDayWorkout } from "@shared/examples/workout-samples";

export default function SampleWorkout() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Transform the shared WorkoutSession sample into the plan format expected by /workout-session
    const plan = {
      name: sampleLegDayWorkout.name,
      exercises: sampleLegDayWorkout.exercises.map((ex) => ({
        id: ex.exerciseId,
        name: ex.exerciseName,
        category: "strength",
        muscleGroups: [],
        equipment: [],
        difficulty: "Intermediate",
        // Map sets to target format used by workout-session
        sets: ex.sets.map((s) => ({
          targetReps: s.reps,
          weight: s.weight ?? 0,
          restTime: s.restTime ?? 90,
        })),
      })),
    };

    const exerciseIds = plan.exercises.map((e) => e.id).join(",");
    const planParam = encodeURIComponent(JSON.stringify(plan));
    // Redirect to the workout-session with the plan hydrated
    setLocation(`/workout-session?exercises=${encodeURIComponent(exerciseIds)}&plan=${planParam}`);
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center text-gray-700 dark:text-gray-300">
        Loading sample workout...
      </div>
    </div>
  );
}
