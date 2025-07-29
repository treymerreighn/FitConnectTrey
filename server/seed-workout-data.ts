import { storage } from "./storage";
import type { InsertWorkoutSession, InsertExerciseProgress } from "@shared/schema";

export async function seedWorkoutData() {
  console.log("🏋️ Seeding sample workout data...");
  
  const userId = "44595091"; // Current user ID
  
  // Get some exercises for the workout
  const exercises = await storage.getAllExercises();
  const benchPress = exercises.find(ex => ex.name.toLowerCase().includes("bench"));
  const squat = exercises.find(ex => ex.name.toLowerCase().includes("squat"));
  const deadlift = exercises.find(ex => ex.name.toLowerCase().includes("deadlift"));
  
  if (!benchPress || !squat || !deadlift) {
    console.log("❌ Required exercises not found for seeding");
    return;
  }

  // Create sample workout sessions over the past 30 days
  const today = new Date();
  const workoutSessions = [];
  
  for (let i = 30; i >= 0; i -= 3) { // Every 3 days
    const workoutDate = new Date(today);
    workoutDate.setDate(today.getDate() - i);
    
    // Progressive weights for bench press
    const benchWeight = 135 + (30 - i) * 2; // Start at 135, add 2lbs every session
    const squatWeight = 185 + (30 - i) * 3; // Start at 185, add 3lbs every session  
    const deadliftWeight = 225 + (30 - i) * 4; // Start at 225, add 4lbs every session
    
    const workoutSession: InsertWorkoutSession = {
      userId,
      name: `Push Day ${Math.floor((30 - i) / 3) + 1}`,
      startTime: workoutDate,
      endTime: new Date(workoutDate.getTime() + 60 * 60 * 1000), // 1 hour later
      totalDuration: 60,
      exercises: [
        {
          exerciseId: benchPress.id,
          exerciseName: benchPress.name,
          sets: [
            { reps: 8, weight: benchWeight - 10, completed: true },
            { reps: 8, weight: benchWeight, completed: true },
            { reps: 6, weight: benchWeight + 5, completed: true },
            { reps: 4, weight: benchWeight + 10, completed: true }
          ],
          totalVolume: Math.round((benchWeight - 10) * 8 + benchWeight * 8 + (benchWeight + 5) * 6 + (benchWeight + 10) * 4),
          personalRecord: i < 6 // Last 2 sessions are PRs
        },
        {
          exerciseId: squat.id,
          exerciseName: squat.name,
          sets: [
            { reps: 10, weight: squatWeight - 15, completed: true },
            { reps: 8, weight: squatWeight, completed: true },
            { reps: 6, weight: squatWeight + 10, completed: true }
          ],
          totalVolume: Math.round((squatWeight - 15) * 10 + squatWeight * 8 + (squatWeight + 10) * 6),
          personalRecord: i < 9 // Last 3 sessions are PRs
        },
        {
          exerciseId: deadlift.id,
          exerciseName: deadlift.name,
          sets: [
            { reps: 5, weight: deadliftWeight, completed: true },
            { reps: 3, weight: deadliftWeight + 20, completed: true },
            { reps: 1, weight: deadliftWeight + 40, completed: true }
          ],
          totalVolume: Math.round(deadliftWeight * 5 + (deadliftWeight + 20) * 3 + (deadliftWeight + 40) * 1),
          personalRecord: i < 12 // Last 4 sessions are PRs
        }
      ],
      totalVolume: 0, // Will be calculated
      caloriesBurned: 450 + Math.random() * 100 // Random calories between 450-550
    };
    
    // Calculate total volume
    workoutSession.totalVolume = workoutSession.exercises.reduce((sum, ex) => sum + (ex.totalVolume || 0), 0);
    
    try {
      await storage.createWorkoutSession(workoutSession);
      workoutSessions.push(workoutSession);
    } catch (error) {
      console.error(`Failed to create workout session for day ${i}:`, error);
    }
  }
  
  console.log(`✅ Seeded ${workoutSessions.length} workout sessions with progressive loading`);
  console.log("📊 Charts should now show realistic strength progression data");
}

// Helper function to calculate estimated 1RM
function calculateOneRepMax(weight: number, reps: number): number {
  // Epley formula: 1RM = weight * (1 + reps/30)
  return Math.round(weight * (1 + reps / 30));
}