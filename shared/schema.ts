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
  createdAt: z.date().default(() => new Date()),
});

export type User = z.infer<typeof userSchema>;

// Post base schema
export const postSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["workout", "nutrition", "progress"]),
  caption: z.string(),
  image: z.string().optional(),
  likes: z.array(z.string()).default([]),
  comments: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  // Type-specific data
  workoutData: z.object({
    workoutType: z.string(),
    duration: z.number(),
    calories: z.number(),
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

// Insert schemas
export const insertUserSchema = userSchema.omit({ id: true, createdAt: true });
export const insertPostSchema = postSchema.omit({ id: true, createdAt: true, likes: true, comments: true });
export const insertCommentSchema = commentSchema.omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
