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
  height: integer("height"),
  weight: integer("weight"),
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
  type: text("type").notNull().default("weight"), // weight, measurements, photos
  weight: integer("weight"),
  bodyFat: integer("body_fat"),
  muscleMass: integer("muscle_mass"),
  measurements: jsonb("measurements"),
  photos: text("photos").array().default([]),
  notes: text("notes"),
  mood: text("mood"),
  energyLevel: integer("energy_level"),
  aiInsights: text("ai_insights"),
  isPrivate: boolean("is_private").default(true),
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

export const workoutSessions = pgTable("workout_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  totalDuration: integer("total_duration"), // in minutes
  exercises: jsonb("exercises").notNull(), // structured exercise data with sets/reps
  totalVolume: integer("total_volume"), // total weight lifted
  caloriesBurned: integer("calories_burned"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exerciseProgress = pgTable("exercise_progress", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  exerciseId: text("exercise_id").notNull().references(() => exercises.id),
  exerciseName: text("exercise_name").notNull(), // denormalized for performance
  date: timestamp("date").notNull(),
  bestSet: jsonb("best_set").notNull(), // best set from that workout
  totalVolume: integer("total_volume"),
  personalRecord: boolean("personal_record").default(false),
  workoutSessionId: text("workout_session_id").references(() => workoutSessions.id),
  createdAt: timestamp("created_at").defaultNow(),
});
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type"),
  text: text("text").notNull(),
  url: text("url"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  participants: text("participants").array().notNull(),
  lastMessageId: text("last_message_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => conversations.id),
  senderId: text("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});