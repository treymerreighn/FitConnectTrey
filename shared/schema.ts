import { z } from "zod";

// User schema
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  email: z.string().email(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  fitnessGoals: z.array(z.string()).optional(),
  followers: z.array(z.string()).default([]),
  following: z.array(z.string()).default([]),
  // Professional verification
  isVerified: z.boolean().default(false),
  professionalType: z.enum(["trainer", "nutritionist"]).optional(),
  certifications: z.array(z.string()).default([]),
  specialties: z.array(z.string()).default([]),
  experience: z.string().optional(),
  hourlyRate: z.number().optional(),
  // Client relationships
  clients: z.array(z.string()).default([]),
  trainers: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
});

export type User = z.infer<typeof userSchema>;

// Post base schema
export const postSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["workout", "nutrition", "progress"]),
  caption: z.string(),
  images: z.array(z.string()).default([]),
  likes: z.array(z.string()).default([]),
  comments: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  // Type-specific data
  workoutData: z.object({
    workoutType: z.string(),
    duration: z.number(),
    calories: z.number(),
    exercises: z.array(z.object({
      name: z.string(),
      sets: z.array(z.object({
        reps: z.number(),
        weight: z.number().optional(),
        duration: z.number().optional(), // for time-based exercises
        distance: z.number().optional(), // for cardio
        rest: z.number().optional(), // rest time in seconds
      })),
      notes: z.string().optional(),
    })).optional(),
    // Legacy fields for backward compatibility
    sets: z.number().optional(),
    reps: z.string().optional(),
    intervals: z.number().optional(),
    rest: z.string().optional(),
  }).optional(),
  nutritionData: z.object({
    mealType: z.string(),
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
  }).optional(),
  progressData: z.object({
    progressType: z.string(),
    weightLost: z.string().optional(),
    bodyFat: z.string().optional(),
    muscleGain: z.string().optional(),
    duration: z.string(),
  }).optional(),
});

export type Post = z.infer<typeof postSchema>;

// Comment schema
export const commentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  postId: z.string(),
  content: z.string(),
  createdAt: z.date().default(() => new Date()),
});

export type Comment = z.infer<typeof commentSchema>;

// Client-Professional Connection schema
export const connectionSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  professionalId: z.string(),
  status: z.enum(["pending", "active", "inactive"]),
  startDate: z.date(),
  endDate: z.date().optional(),
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
});

export type Connection = z.infer<typeof connectionSchema>;

// Progress Entry schema for detailed tracking
export const progressEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.date(),
  weight: z.number().optional(),
  bodyFatPercentage: z.number().optional(),
  muscleMass: z.number().optional(),
  measurements: z.object({
    chest: z.number().optional(),
    waist: z.number().optional(),
    hips: z.number().optional(),
    arms: z.number().optional(),
    thighs: z.number().optional(),
  }).optional(),
  photos: z.array(z.string()).default([]), // photo URLs
  notes: z.string().optional(),
  mood: z.enum(["excellent", "good", "average", "poor", "terrible"]).optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  isPrivate: z.boolean().default(true),
  aiInsights: z.object({
    bodyComposition: z.string().optional(),
    progressAnalysis: z.string().optional(),
    recommendations: z.array(z.string()).default([]),
    confidenceScore: z.number().min(0).max(1).optional(),
    generatedAt: z.date().optional(),
  }).optional(),
  createdAt: z.date().default(() => new Date()),
});

export type ProgressEntry = z.infer<typeof progressEntrySchema>;

// Insert schemas
export const insertUserSchema = userSchema.omit({ id: true, createdAt: true });
export const insertPostSchema = postSchema.omit({ id: true, createdAt: true, likes: true, comments: true });
export const insertCommentSchema = commentSchema.omit({ id: true, createdAt: true });
export const insertConnectionSchema = connectionSchema.omit({ id: true, createdAt: true });
export const insertProgressEntrySchema = progressEntrySchema.omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type InsertProgressEntry = z.infer<typeof insertProgressEntrySchema>;
