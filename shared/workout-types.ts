// Canonical workout and template types to unify workoutData usage across posts,
// builder, active session, saved workouts, and templates.
// These are intentionally lightweight and forward-compatible. They do NOT yet
// enforce DB persistence (workout sessions already persisted separately).

import { z } from "zod";

// A single planned set inside a template (targets) or a completed set (actuals)
export const workoutSetSchema = z.object({
  reps: z.number().optional(),
  weight: z.number().optional(), // in lbs (or kg if future unit field added)
  duration: z.number().optional(), // seconds for time-based holds or cardio intervals
  distance: z.number().optional(), // meters (future: unit support)
  restSeconds: z.number().optional(), // rest after this set
  notes: z.string().optional(),
});
export type WorkoutSet = z.infer<typeof workoutSetSchema>;

// An exercise block in a workout template
export const workoutTemplateExerciseSchema = z.object({
  id: z.string().optional(), // internal unique id for UI ordering (nanoid)
  exerciseId: z.string().optional(), // links to canonical Exercise if available
  name: z.string(), // fallback/display name (required for portability)
  sets: z.array(workoutSetSchema).default([]),
  groupId: z.string().optional(), // for supersets/circuits (future feature)
  notes: z.string().optional(),
  order: z.number().optional(),
});
export type WorkoutTemplateExercise = z.infer<typeof workoutTemplateExerciseSchema>;

// A reusable workout template definition
export const workoutTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  ownerUserId: z.string(),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  estimatedDurationMinutes: z.number().optional(),
  exercises: z.array(workoutTemplateExerciseSchema),
  sourcePostId: z.string().optional(), // if derived from a social post
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type WorkoutTemplate = z.infer<typeof workoutTemplateSchema>;

// Saved workout reference (user bookmarking a template/post for later use)
export const savedWorkoutSchema = z.object({
  id: z.string(),
  userId: z.string(),
  templateId: z.string(), // references WorkoutTemplate.id OR Post.id acting as a template
  sourceType: z.enum(["template", "post"]).default("template"),
  notes: z.string().optional(),
  dataSnapshot: z.any().optional(), // optional frozen copy for immutability / historical reference
  createdAt: z.date().default(() => new Date()),
});
export type SavedWorkout = z.infer<typeof savedWorkoutSchema>;

// Insert schemas (omit generated fields)
export const insertWorkoutTemplateSchema = workoutTemplateSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWorkoutTemplate = z.infer<typeof insertWorkoutTemplateSchema>;

export const insertSavedWorkoutSchema = savedWorkoutSchema.omit({ id: true, createdAt: true });
export type InsertSavedWorkout = z.infer<typeof insertSavedWorkoutSchema>;

// Utility: minimal function to estimate duration from sets (heuristic)
export function estimateTemplateDuration(template: WorkoutTemplate): number {
  // Each set: (movement time) + rest. Assume avg movement time ~ (reps * 4s) or duration field.
  let totalSeconds = 0;
  template.exercises.forEach(ex => {
    ex.sets.forEach(set => {
      if (set.duration) {
        totalSeconds += set.duration;
      } else if (set.reps) {
        totalSeconds += set.reps * 4; // heuristic 4s per rep
      } else {
        totalSeconds += 30; // fallback average
      }
      if (set.restSeconds) totalSeconds += set.restSeconds;
      else totalSeconds += 60; // default rest if not specified
    });
  });
  return Math.round(totalSeconds / 60); // minutes
}
