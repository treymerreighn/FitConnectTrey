import { pgTable, text, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  bio: text("bio"),
  avatar: text("avatar"),
  isVerified: boolean("is_verified").default(false),
  accountType: text("account_type").notNull().default("user"),
  fitnessGoals: text("fitness_goals").array().default([]),
  followers: text("followers").array().default([]),
  following: text("following").array().default([]),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // workout, nutrition, progress
  caption: text("caption").notNull(),
  images: text("images").array().default([]),
  likes: text("likes").array().default([]),
  comments: text("comments").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  workoutData: jsonb("workout_data"),
  nutritionData: jsonb("nutrition_data"),
  progressData: jsonb("progress_data"),
});

export const comments = pgTable("comments", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => posts.id),
  userId: text("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const connections = pgTable("connections", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().references(() => users.id),
  professionalId: text("professional_id").notNull().references(() => users.id),
  type: text("type").notNull(), // trainer, nutritionist
  status: text("status").notNull().default("pending"),
  requestMessage: text("request_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const progressEntries = pgTable("progress_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  type: text("type").notNull(), // weight, measurements, photos
  weight: integer("weight"),
  bodyFat: integer("body_fat"),
  muscleMass: integer("muscle_mass"),
  measurements: jsonb("measurements"),
  photos: text("photos").array().default([]),
  notes: text("notes"),
  mood: text("mood"),
  energyLevel: integer("energy_level"),
  aiInsights: text("ai_insights"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exercises = pgTable("exercises", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  instructions: text("instructions").array().default([]),
  category: text("category").notNull(),
  muscleGroups: text("muscle_groups").array().default([]),
  equipment: text("equipment").array().default([]),
  difficulty: text("difficulty").notNull(),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  tips: text("tips").array().default([]),
  createdBy: text("created_by").references(() => users.id),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});