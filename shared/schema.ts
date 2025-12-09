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
  blockedUsers: z.array(z.string()).default([]),
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
  // Optional location for user profile
  location: z.string().optional(),
  // Premium subscription
  isPremium: z.boolean().default(false),
  subscriptionTier: z.enum(["free", "premium", "pro"]).default("free"),
  subscriptionExpiresAt: z.date().optional(),
  // Admin flag
  isAdmin: z.boolean().default(false),
  // Optional physical attributes
  height: z.number().optional(), // in inches
  weight: z.number().optional(), // in pounds (current weight)
  createdAt: z.date().default(() => new Date()),
});

export type User = z.infer<typeof userSchema>;

// Recipe schema for healthy recipes database
export const recipeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
  cookTime: z.number(), // in minutes
  prepTime: z.number(), // in minutes
  servings: z.number(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  cuisineType: z.string().optional(), // italian, asian, mexican, etc.
  dietaryTags: z.array(z.string()).optional(), // vegetarian, vegan, gluten-free, etc.
  calories: z.number().optional(),
  protein: z.number().optional(), // in grams
  carbs: z.number().optional(), // in grams
  fat: z.number().optional(), // in grams
  fiber: z.number().optional(), // in grams
  image: z.string().optional(),
  isAiGenerated: z.boolean().default(true),
  category: z.enum(["breakfast", "lunch", "dinner", "snack", "dessert"]),
  healthBenefits: z.array(z.string()).default([]),
  tips: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
});

export type Recipe = z.infer<typeof recipeSchema>;

// Community Meal schema for user-shared meals
export const communityMealSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  caption: z.string(),
  imageUrl: z.string().optional(),
  ingredients: z.array(z.string()).default([]),
  calories: z.number().optional(),
  protein: z.number().optional(), // in grams
  carbs: z.number().optional(), // in grams
  fat: z.number().optional(), // in grams
  fiber: z.number().optional(), // in grams
  likes: z.array(z.string()).default([]),
  comments: z.array(z.string()).default([]),
  isPostedToFeed: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
});

export type CommunityMeal = z.infer<typeof communityMealSchema>;

// Progress insights schema for AI analysis of progress photos
export const progressInsightSchema = z.object({
  id: z.string(),
  userId: z.string(),
  imageUrl: z.string(),
  analysisData: z.object({
    overallAssessment: z.string(),
    muscleDefinition: z.object({
      score: z.number().min(1).max(10),
      notes: z.string(),
    }),
    posture: z.object({
      score: z.number().min(1).max(10),
      notes: z.string(),
    }),
    bodyComposition: z.object({
      assessment: z.string(),
      changes: z.array(z.string()),
    }),
    recommendations: z.array(z.string()),
    motivationalMessage: z.string(),
  }),
  createdAt: z.date().default(() => new Date()),
});

export type ProgressInsight = z.infer<typeof progressInsightSchema>;
export type InsertProgressInsight = Omit<ProgressInsight, 'id' | 'createdAt'>;

// Strength Insights schema for post-workout AI analysis (premium feature)
export const strengthInsightSchema = z.object({
  id: z.string(),
  userId: z.string(),
  postId: z.string().optional(), // Associated workout post
  workoutData: z.object({
    exercises: z.array(z.object({
      name: z.string(),
      sets: z.array(z.object({
        reps: z.number(),
        weight: z.number().optional(),
        isPersonalRecord: z.boolean().optional(),
      })),
      totalVolume: z.number().optional(), // sets × reps × weight
    })),
    duration: z.number().optional(),
    workoutType: z.string().optional(),
  }),
  insights: z.object({
    summary: z.string(), // Quick workout summary
    volumeAnalysis: z.string(), // Analysis of training volume
    strengthTrends: z.array(z.object({
      exercise: z.string(),
      trend: z.enum(["increasing", "decreasing", "maintaining", "new"]),
      note: z.string(),
    })),
    muscleGroupFocus: z.array(z.string()), // Primary muscle groups worked
    personalRecords: z.array(z.object({
      exercise: z.string(),
      achievement: z.string(),
      previousBest: z.string().optional(),
    })),
    recommendations: z.array(z.string()),
    motivationalMessage: z.string(),
    recoveryTips: z.array(z.string()),
    nextWorkoutSuggestion: z.string().optional(),
  }),
  createdAt: z.date().default(() => new Date()),
});

export type StrengthInsight = z.infer<typeof strengthInsightSchema>;
export type InsertStrengthInsight = Omit<StrengthInsight, 'id' | 'createdAt'>;

// Post base schema
export const postSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["workout", "nutrition", "progress"]),
  caption: z.string(),
  images: z.array(z.string()).default([]), // Keep for backward compatibility
  likes: z.array(z.string()).default([]),
  comments: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  // Exercise tags for workout videos (community feature)
  exerciseTags: z.array(z.string()).default([]), // Keep for backward compatibility
  // New media items structure with individual tagging
  mediaItems: z.array(z.object({
    url: z.string(),
    type: z.enum(['image', 'video']),
    exerciseTags: z.array(z.string()).default([]), // Tags specific to this media item
  })).default([]).optional(),
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
    fiber: z.number().optional(),
    ingredients: z.array(z.string()).optional(),
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

// Exercise Library schema
export const exerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(["strength", "cardio", "flexibility", "sports", "functional"]),
  muscleGroups: z.array(z.enum([
    "chest", "back", "shoulders", "biceps", "triceps", "forearms",
    "abs", "obliques", "lower_back", "glutes", "quadriceps", 
    "hamstrings", "calves", "traps", "lats", "delts"
  ])),
  equipment: z.array(z.string()).default([]), // barbell, dumbbell, bodyweight, etc.
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  description: z.string(),
  instructions: z.array(z.string()), // step-by-step instructions
  tips: z.array(z.string()).default([]),
  safetyNotes: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]), // exercise demonstration images
  videos: z.array(z.string()).default([]), // exercise demonstration videos
  variations: z.array(z.string()).default([]), // exercise variations
  isUserCreated: z.boolean().default(false),
  createdBy: z.string().optional(), // user ID if user-created
  isApproved: z.boolean().default(true), // for user-created exercises
  tags: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
});

export type Exercise = z.infer<typeof exerciseSchema>;

// Report schema for flagged posts
export const reportSchema = z.object({
  id: z.string(),
  postId: z.string(),
  reporterId: z.string(),
  reason: z.string(),
  status: z.enum(["pending", "reviewed", "dismissed"]).default("pending"),
  createdAt: z.date().default(() => new Date()),
});

export type Report = z.infer<typeof reportSchema>;

// Insert schemas
export const insertUserSchema = userSchema.omit({ id: true, createdAt: true });
export const insertPostSchema = postSchema.omit({ id: true, createdAt: true, likes: true, comments: true });
export const insertCommentSchema = commentSchema.omit({ id: true, createdAt: true });
export const insertConnectionSchema = connectionSchema.omit({ id: true, createdAt: true });
export const insertProgressEntrySchema = progressEntrySchema.omit({ id: true, createdAt: true });
export const insertExerciseSchema = exerciseSchema.omit({ id: true, createdAt: true });
export const insertReportSchema = reportSchema.omit({ id: true, createdAt: true, status: true });

// Workout session tracking schema
export const workoutSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  totalDuration: z.number().optional(), // in minutes
  exercises: z.array(z.object({
    exerciseId: z.string(),
    exerciseName: z.string(),
    sets: z.array(z.object({
      reps: z.number(),
      weight: z.number().optional(),
      duration: z.number().optional(), // for time-based exercises like planks
      distance: z.number().optional(), // for cardio
      restTime: z.number().optional(), // rest after this set in seconds
      oneRepMax: z.number().optional(), // calculated 1RM
      completed: z.boolean().default(true),
    })),
    totalVolume: z.number().optional(), // total weight lifted for this exercise
    personalRecord: z.boolean().default(false),
    notes: z.string().optional(),
  })),
  totalVolume: z.number().optional(), // total workout volume
  caloriesBurned: z.number().optional(),
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
});

// Exercise progress tracking schema
export const exerciseProgressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  exerciseId: z.string(),
  exerciseName: z.string(),
  date: z.date(),
  bestSet: z.object({
    reps: z.number(),
    weight: z.number().optional(),
    duration: z.number().optional(),
    distance: z.number().optional(),
    oneRepMax: z.number().optional(),
  }),
  totalVolume: z.number().optional(),
  personalRecord: z.boolean().default(false),
  workoutSessionId: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
});

export type WorkoutSession = z.infer<typeof workoutSessionSchema>;
export type ExerciseProgress = z.infer<typeof exerciseProgressSchema>;

export const insertWorkoutSessionSchema = workoutSessionSchema.omit({ id: true, createdAt: true });
export const insertExerciseProgressSchema = exerciseProgressSchema.omit({ id: true, createdAt: true });

// Story schema - for 24-hour disappearing stories
export const storySchema = z.object({
  id: z.string(),
  userId: z.string(),
  image: z.string(), // S3 URL
  caption: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  expiresAt: z.date(), // 24 hours from creation
  views: z.array(z.string()).default([]), // array of userIds who viewed
});

export type Story = z.infer<typeof storySchema>;

export const insertStorySchema = storySchema.omit({ id: true, createdAt: true, views: true, expiresAt: true });
export type InsertStory = z.infer<typeof insertStorySchema>;

// Saved Meal schema - for user bookmarking community meals
export const savedMealSchema = z.object({
  id: z.string(),
  userId: z.string(),
  mealId: z.string(), // references CommunityMeal.id
  dataSnapshot: z.any().optional(), // frozen copy of meal data for historical reference
  createdAt: z.date().default(() => new Date()),
});

export type SavedMeal = z.infer<typeof savedMealSchema>;

export const insertSavedMealSchema = savedMealSchema.omit({ id: true, createdAt: true });
export type InsertSavedMeal = z.infer<typeof insertSavedMealSchema>;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type InsertProgressEntry = z.infer<typeof insertProgressEntrySchema>;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type InsertWorkoutSession = z.infer<typeof insertWorkoutSessionSchema>;
export type InsertExerciseProgress = z.infer<typeof insertExerciseProgressSchema>;
export type InsertReport = z.infer<typeof insertReportSchema>;
