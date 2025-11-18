import type { WorkoutSession } from "../schema.ts";

// Sample Leg Day workout session fixture
export const sampleLegDayWorkout: WorkoutSession = {
  id: "ws_legday_001",
  userId: "user_123",
  name: "Leg Day Strength — Squats, RDLs, Lunges, Leg Press",
  startTime: new Date("2025-10-30T08:00:00.000Z"),
  endTime: new Date("2025-10-30T09:00:00.000Z"),
  totalDuration: 60,
  exercises: [
    {
      exerciseId: "ex_back_squat",
      exerciseName: "Back Squat",
      sets: [
        { reps: 8, weight: 185, restTime: 120, completed: true },
        { reps: 8, weight: 205, restTime: 150, completed: true },
        { reps: 6, weight: 225, restTime: 180, completed: true }
      ],
      totalVolume: 3660,
      personalRecord: false,
      notes: "Focused on depth and bracing. Slight quad burn, no knee pain."
    },
    {
      exerciseId: "ex_rdl",
      exerciseName: "Romanian Deadlift",
      sets: [
        { reps: 10, weight: 135, restTime: 90, completed: true },
        { reps: 10, weight: 155, restTime: 90, completed: true },
        { reps: 8,  weight: 185, restTime: 120, completed: true }
      ],
      totalVolume: 4520,
      personalRecord: false,
      notes: "Hamstrings smoked. Kept bar close and back flat."
    },
    {
      exerciseId: "ex_walking_lunge",
      exerciseName: "Walking Dumbbell Lunge",
      sets: [
        { reps: 20, weight: 40, restTime: 75, completed: true },
        { reps: 20, weight: 40, restTime: 75, completed: true },
        { reps: 20, weight: 40, restTime: 90, completed: true }
      ],
      totalVolume: 2400,
      personalRecord: false,
      notes: "Counted 10 steps per leg. Core and balance challenged."
    },
    {
      exerciseId: "ex_leg_press",
      exerciseName: "45° Leg Press",
      sets: [
        { reps: 12, weight: 270, restTime: 90, completed: true },
        { reps: 12, weight: 270, restTime: 90, completed: true },
        { reps: 10, weight: 320, restTime: 120, completed: true }
      ],
      totalVolume: 10260,
      personalRecord: false,
      notes: "Full range, controlled tempo. Huge quad pump."
    }
  ],
  totalVolume: 20840,
  caloriesBurned: 520,
  notes: "Solid leg day. Focused on strength and controlled tempo. Hydrated well, no joint pain.",
  createdAt: new Date("2025-10-30T09:05:00.000Z")
};
