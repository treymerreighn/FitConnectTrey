import { Router } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { insertUserSchema, insertPostSchema, insertCommentSchema, insertConnectionSchema, insertProgressEntrySchema, insertExerciseSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateAIWorkout } from "./ai-workout";
import { generateExerciseDatabase, generateWorkoutTemplates } from "./ai-exercise-generator";
import { seedExerciseDatabase } from "./seed-exercises";
import { removeDuplicateExercises } from "./duplicate-remover";
import { AIWorkoutIntelligence } from "./ai-fitness-coach";
import { AINutritionCoach } from "./ai-nutrition-coach";
import { AIProgressAnalyzer } from "./ai-progress-analyzer";
import { generatePersonalizedRecipe } from "./ai-meal-helper";

const router = Router();

// Users
router.get("/api/users", async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/api/users/:id", async (req, res) => {
  try {
    const user = await storage.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.post("/api/users", async (req, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    const user = await storage.createUser(userData);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Post interactions
router.post("/api/posts/:id/like", async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await storage.likePost(req.params.id, userId);
    res.json(post);
  } catch (error) {
    console.error("Failed to like post:", error);
    res.status(500).json({ error: "Failed to like post" });
  }
});

router.post("/api/posts/:id/unlike", async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await storage.unlikePost(req.params.id, userId);
    res.json(post);
  } catch (error) {
    console.error("Failed to unlike post:", error);
    res.status(500).json({ error: "Failed to unlike post" });
  }
});

// Posts
router.get("/api/posts", async (req, res) => {
  try {
    const posts = await storage.getAllPosts();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

router.get("/api/posts/:id", async (req, res) => {
  try {
    const post = await storage.getPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

router.get("/api/users/:id/posts", async (req, res) => {
  try {
    const posts = await storage.getPostsByUserId(req.params.id);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user posts" });
  }
});

// Completed Workouts
router.post("/api/workouts/completed", async (req, res) => {
  try {
    // For now, just return success - can be enhanced with actual database storage
    res.status(201).json({ success: true, id: Date.now().toString() });
  } catch (error) {
    res.status(500).json({ error: "Failed to save completed workout" });
  }
});

router.get("/api/workouts/completed/:userId", async (req, res) => {
  try {
    // Mock data for now - replace with actual database query
    const workouts = [
      {
        id: "1",
        name: "Morning Push Workout",
        duration: 2400, // 40 minutes in seconds
        calories: 320,
        completedSets: 12,
        totalSets: 15,
        exercises: [
          { name: "Push-ups", sets: [{ reps: 15, weight: 0 }, { reps: 12, weight: 0 }] },
          { name: "Bench Press", sets: [{ reps: 8, weight: 135 }, { reps: 6, weight: 145 }] }
        ],
        createdAt: new Date(Date.now() - 86400000) // Yesterday
      }
    ];
    res.json(workouts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch completed workouts" });
  }
});

router.post("/api/posts", async (req, res) => {
  try {
    const postData = {
      ...req.body,
      images: req.body.image ? [req.body.image] : [],
      createdAt: new Date(),
      likes: [],
      comments: []
    };
    delete postData.image; // Remove the single image field since we use images array
    
    const post = await storage.createPost(postData);
    res.status(201).json(post);
  } catch (error) {
    console.error("Failed to create post:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create post" });
  }
});

router.delete("/api/posts/:id", async (req, res) => {
  try {
    const success = await storage.deletePost(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// Trending workouts
router.get("/api/workouts/trending", async (req, res) => {
  try {
    const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
    const trendingWorkouts = await storage.getTrendingWorkouts(hours);
    res.json(trendingWorkouts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch trending workouts" });
  }
});

// Comments
router.get("/api/posts/:postId/comments", async (req, res) => {
  try {
    const comments = await storage.getCommentsByPostId(req.params.postId);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

router.post("/api/posts/:postId/comments", async (req, res) => {
  try {
    const commentData = insertCommentSchema.parse({
      ...req.body,
      postId: req.params.postId,
    });
    const comment = await storage.createComment(commentData);
    res.status(201).json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create comment" });
  }
});

// Social actions
router.post("/api/posts/:id/like", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    const post = await storage.likePost(req.params.id, userId);
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to like post" });
  }
});

router.post("/api/posts/:id/unlike", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    const post = await storage.unlikePost(req.params.id, userId);
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to unlike post" });
  }
});

router.post("/api/users/:id/follow", async (req, res) => {
  try {
    const { followerId } = req.body;
    if (!followerId) {
      return res.status(400).json({ error: "Follower ID is required" });
    }
    
    await storage.followUser(followerId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to follow user" });
  }
});

router.post("/api/users/:id/unfollow", async (req, res) => {
  try {
    const { followerId } = req.body;
    if (!followerId) {
      return res.status(400).json({ error: "Follower ID is required" });
    }
    
    await storage.unfollowUser(followerId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to unfollow user" });
  }
});

// Professional connections
router.get("/api/professionals", async (req, res) => {
  try {
    const { type } = req.query;
    const professionals = await storage.getProfessionals(type as "trainer" | "nutritionist");
    res.json(professionals);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch professionals" });
  }
});

router.post("/api/connections", async (req, res) => {
  try {
    const connectionData = insertConnectionSchema.parse(req.body);
    const connection = await storage.createConnection(connectionData);
    res.status(201).json(connection);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create connection" });
  }
});

router.get("/api/connections/client/:clientId", async (req, res) => {
  try {
    const connections = await storage.getConnectionsByClientId(req.params.clientId);
    res.json(connections);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch client connections" });
  }
});

router.get("/api/connections/professional/:professionalId", async (req, res) => {
  try {
    const connections = await storage.getConnectionsByProfessionalId(req.params.professionalId);
    res.json(connections);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch professional connections" });
  }
});

router.put("/api/connections/:id", async (req, res) => {
  try {
    const updates = req.body;
    const connection = await storage.updateConnection(req.params.id, updates);
    res.json(connection);
  } catch (error) {
    res.status(500).json({ error: "Failed to update connection" });
  }
});

router.delete("/api/connections/:id", async (req, res) => {
  try {
    const success = await storage.deleteConnection(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Connection not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete connection" });
  }
});

// Progress tracking
router.post("/api/progress", async (req, res) => {
  console.log("🚨 Progress endpoint hit!");
  try {
    console.log("Raw request body:", req.body);
    
    // Parse date string to Date object if needed and ensure proper defaults
    const requestData = { 
      ...req.body,
      photos: req.body.photos || [],
      isPrivate: req.body.isPrivate !== undefined ? req.body.isPrivate : true
    };
    
    if (typeof requestData.date === 'string') {
      requestData.date = new Date(requestData.date);
    }
    
    console.log("Processed request data:", requestData);
    
    try {
      const entryData = insertProgressEntrySchema.parse(requestData);
      console.log("Schema validation passed:", entryData);
      const entry = await storage.createProgressEntry(entryData);
      console.log("Created entry:", entry);
      
      res.status(201).json(entry);
    } catch (validationError) {
      console.error("Schema validation failed:", validationError);
      if (validationError instanceof z.ZodError) {
        console.error("Validation errors detail:", validationError.errors);
        return res.status(400).json({ error: validationError.errors });
      }
      throw validationError;
    }
  } catch (error) {
    console.error("Progress entry creation error:", error);
    if (error instanceof z.ZodError) {
      console.error("Validation errors:", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Invalid progress data" });
  }
});

router.get("/api/progress/user/:userId", async (req, res) => {
  try {
    const entries = await storage.getProgressEntriesByUserId(req.params.userId);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch progress entries" });
  }
});

router.get("/api/progress/:id", async (req, res) => {
  try {
    const entry = await storage.getProgressEntryById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: "Progress entry not found" });
    }
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch progress entry" });
  }
});

router.put("/api/progress/:id", async (req, res) => {
  try {
    const updates = req.body;
    const entry = await storage.updateProgressEntry(req.params.id, updates);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: "Failed to update progress entry" });
  }
});

router.delete("/api/progress/:id", async (req, res) => {
  try {
    const success = await storage.deleteProgressEntry(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Progress entry not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete progress entry" });
  }
});

// Enhanced AI Progress Analysis
router.post("/api/progress/:id/ai-insights", async (req, res) => {
  try {
    const { photos } = req.body;
    const entry = await storage.generateAIInsights(req.params.id, photos || []);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate AI insights" });
  }
});

// AI Progress Photo Analysis
router.post("/api/ai/analyze-progress-photo", async (req, res) => {
  try {
    const { imageUrl, previousAnalysis, userGoals, timeframe } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }
    
    const analysis = await AIProgressAnalyzer.analyzeProgressPhoto(
      imageUrl,
      previousAnalysis,
      userGoals || ["general_fitness"],
      timeframe || "1 month"
    );
    
    res.json(analysis);
  } catch (error) {
    console.error("Progress photo analysis error:", error);
    res.status(500).json({ error: "Failed to analyze progress photo" });
  }
});

// AI Weight Trend Analysis
router.post("/api/ai/analyze-weight-trends", async (req, res) => {
  try {
    const { weightEntries, userGoals, workoutData } = req.body;
    
    if (!weightEntries || !Array.isArray(weightEntries)) {
      return res.status(400).json({ error: "Weight entries array is required" });
    }
    
    const analysis = await AIProgressAnalyzer.analyzeWeightTrends(
      weightEntries,
      userGoals || ["general_fitness"],
      workoutData || []
    );
    
    res.json(analysis);
  } catch (error) {
    console.error("Weight trend analysis error:", error);
    res.status(500).json({ error: "Failed to analyze weight trends" });
  }
});

// AI Comprehensive Progress Report
router.post("/api/ai/generate-progress-report", async (req, res) => {
  try {
    const { progressPhotos, weightData, workouts, userProfile } = req.body;
    
    const report = await AIProgressAnalyzer.generateProgressReport(
      progressPhotos || [],
      weightData || [],
      workouts || [],
      userProfile || {}
    );
    
    res.json(report);
  } catch (error) {
    console.error("Progress report generation error:", error);
    res.status(500).json({ error: "Failed to generate progress report" });
  }
});

// Exercise library endpoints
router.get("/api/exercises", async (req, res) => {
  try {
    const { category, muscleGroup, search } = req.query;
    
    // Get all exercises first
    let exercises = await storage.getAllExercises();
    
    // Apply filters in sequence
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      exercises = exercises.filter(exercise => 
        exercise.name.toLowerCase().includes(searchLower) ||
        exercise.description.toLowerCase().includes(searchLower) ||
        exercise.muscleGroups.some(muscle => muscle.toLowerCase().includes(searchLower))
      );
    }
    
    if (category && typeof category === 'string') {
      exercises = exercises.filter(exercise => 
        exercise.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    if (muscleGroup && typeof muscleGroup === 'string') {
      exercises = exercises.filter(exercise => 
        exercise.muscleGroups.some(muscle => 
          muscle.toLowerCase() === muscleGroup.toLowerCase()
        )
      );
    }
    
    // Remove duplicates before sending to frontend
    const uniqueExercises = removeDuplicateExercises(exercises);
    console.log(`🧹 API: Found ${exercises.length} exercises after filtering (search: "${search}", category: "${category}", muscleGroup: "${muscleGroup}")`);
    
    res.json(uniqueExercises);
  } catch (error) {
    console.error("Error fetching exercises:", error);
    res.status(500).json({ error: "Failed to fetch exercises" });
  }
});

router.get("/api/exercises/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const exercise = await storage.getExerciseById(id);
    
    if (!exercise) {
      return res.status(404).json({ error: "Exercise not found" });
    }
    
    res.json(exercise);
  } catch (error) {
    console.error("Error fetching exercise:", error);
    res.status(500).json({ error: "Failed to fetch exercise" });
  }
});

router.post("/api/exercises", async (req, res) => {
  try {
    const validatedData = insertExerciseSchema.parse(req.body);
    const exercise = await storage.createExercise(validatedData);
    res.status(201).json(exercise);
  } catch (error: unknown) {
    console.error("Error creating exercise:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid exercise data", details: (error as any).errors });
    }
    res.status(500).json({ error: "Failed to create exercise" });
  }
});

router.put("/api/exercises/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const exercise = await storage.updateExercise(id, updates);
    res.json(exercise);
  } catch (error: unknown) {
    console.error("Error updating exercise:", error);
    if (error instanceof Error && error.message === "Exercise not found") {
      return res.status(404).json({ error: "Exercise not found" });
    }
    res.status(500).json({ error: "Failed to update exercise" });
  }
});

router.delete("/api/exercises/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await storage.deleteExercise(id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Exercise not found" });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting exercise:", error);
    res.status(500).json({ error: "Failed to delete exercise" });
  }
});

router.post("/api/exercises/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const exercise = await storage.approveUserExercise(id);
    res.json(exercise);
  } catch (error: unknown) {
    console.error("Error approving exercise:", error);
    if (error instanceof Error && error.message === "Exercise not found") {
      return res.status(404).json({ error: "Exercise not found" });
    }
    res.status(500).json({ error: "Failed to approve exercise" });
  }
});

router.get("/api/users/:userId/exercises", async (req, res) => {
  try {
    const { userId } = req.params;
    const exercises = await storage.getUserCreatedExercises(userId);
    res.json(exercises);
  } catch (error) {
    console.error("Error fetching user exercises:", error);
    res.status(500).json({ error: "Failed to fetch user exercises" });
  }
});

// AI Workout Generation
router.post("/api/generate-workout", isAuthenticated, async (req, res) => {
  try {
    const workoutRequestSchema = z.object({
      bodyParts: z.array(z.string()),
      fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]),
      duration: z.number().min(15).max(120),
      equipment: z.array(z.string()).default([]),
      goals: z.string(),
      userPrompt: z.string().optional()
    });

    const workoutRequest = workoutRequestSchema.parse(req.body);
    const workout = await generateAIWorkout(workoutRequest);
    
    res.json(workout);
  } catch (error) {
    console.error("AI workout generation error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to generate workout plan" });
  }
});

// AI Database Generation (Admin endpoints)
router.post("/api/admin/seed-exercise-database", isAuthenticated, async (req, res) => {
  try {
    // Seed basic comprehensive exercise library
    await seedExerciseDatabase();
    
    res.json({ message: "Exercise database seeded successfully", count: 20 });
  } catch (error) {
    console.error("Database seeding error:", error);
    res.status(500).json({ error: "Failed to seed exercise database" });
  }
});

router.post("/api/admin/generate-exercise-database", isAuthenticated, async (req, res) => {
  try {
    // Only allow admin users to generate database
    const { isAdmin } = req.body;
    if (!isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Start database generation in background
    generateExerciseDatabase().catch(console.error);
    
    res.json({ message: "Exercise database generation started" });
  } catch (error) {
    console.error("Database generation error:", error);
    res.status(500).json({ error: "Failed to start database generation" });
  }
});

router.post("/api/admin/generate-workout-templates", isAuthenticated, async (req, res) => {
  try {
    const { isAdmin } = req.body;
    if (!isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    generateWorkoutTemplates().catch(console.error);
    
    res.json({ message: "Workout template generation started" });
  } catch (error) {
    console.error("Template generation error:", error);
    res.status(500).json({ error: "Failed to start template generation" });
  }
});

// Get workout templates
router.get("/api/workout-templates", async (req, res) => {
  try {
    const { category, difficulty, bodyPart } = req.query;
    
    // Get workout templates from posts
    const templates = await storage.getWorkoutTemplates({
      category: category as string,
      difficulty: difficulty as string,
      bodyPart: bodyPart as string
    });
    
    res.json(templates);
  } catch (error) {
    console.error("Error fetching workout templates:", error);
    res.status(500).json({ error: "Failed to fetch workout templates" });
  }
});

// Generate AI exercises for the exercise library
router.post("/api/generate-exercise-library", async (req, res) => {
  try {
    console.log("🔥 Building AI Exercise Library with Muscle Diagrams...");
    const { generatePopularExercisesForLibrary } = await import("./ai-exercise-library-builder");
    
    // Start generation in background
    generatePopularExercisesForLibrary().catch(console.error);
    
    res.json({ 
      success: true, 
      message: "Started generating exercise library with muscle diagrams. Check back in a few minutes!" 
    });
  } catch (error) {
    console.error("Error generating exercise library:", error);
    res.status(500).json({ error: "Failed to start exercise library generation" });
  }
});

// Generate comprehensive exercise library (admin only)
router.post("/api/admin/generate-full-exercise-library", async (req, res) => {
  try {
    const { isAdmin } = req.body;
    if (!isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    console.log("🏗️ Building Full AI Exercise Library...");
    const { generateExerciseLibraryWithDiagrams } = await import("./ai-exercise-library-builder");
    
    // Start comprehensive generation in background
    generateExerciseLibraryWithDiagrams().catch(console.error);
    
    res.json({ 
      success: true, 
      message: "Started generating comprehensive exercise library. This will take 15-20 minutes." 
    });
  } catch (error) {
    console.error("Error generating full exercise library:", error);
    res.status(500).json({ error: "Failed to start full library generation" });
  }
});

// Next-Level AI Features

// 1. Smart Exercise Sequencing - AI optimizes workout order for maximum effectiveness
router.post("/api/ai/optimize-workout-sequence", async (req, res) => {
  try {
    const { exercises, userGoals, fitnessLevel } = req.body;
    
    if (!exercises || !Array.isArray(exercises)) {
      return res.status(400).json({ error: "Exercises array is required" });
    }
    
    const optimizedExercises = await AIWorkoutIntelligence.optimizeExerciseSequence(
      exercises, 
      userGoals || ["general_fitness"], 
      fitnessLevel || "intermediate"
    );
    
    res.json({
      optimizedExercises,
      message: "Workout sequence optimized using AI exercise science principles"
    });
  } catch (error) {
    console.error("Exercise sequencing error:", error);
    res.status(500).json({ error: "Failed to optimize workout sequence" });
  }
});

// 2. Dynamic Difficulty Adjustment - AI adjusts workouts in real-time
router.post("/api/ai/adjust-workout-difficulty", async (req, res) => {
  try {
    const { currentWorkout, performanceData, userFeedback } = req.body;
    
    const adjustments = await AIWorkoutIntelligence.adjustWorkoutDifficulty(
      currentWorkout,
      performanceData,
      userFeedback || "feeling good"
    );
    
    res.json(adjustments);
  } catch (error) {
    console.error("Difficulty adjustment error:", error);
    res.status(500).json({ error: "Failed to adjust workout difficulty" });
  }
});

// 3. Predictive Recovery Analytics - AI predicts optimal rest periods
router.post("/api/ai/predict-recovery", async (req, res) => {
  try {
    const { workoutHistory, sleepData, stressLevel } = req.body;
    
    const recoveryPrediction = await AIWorkoutIntelligence.predictRecoveryNeeds(
      workoutHistory || [],
      sleepData || { hours: 7, quality: "good" },
      stressLevel || "moderate"
    );
    
    res.json(recoveryPrediction);
  } catch (error) {
    console.error("Recovery prediction error:", error);
    res.status(500).json({ error: "Failed to predict recovery needs" });
  }
});

// 4. Intelligent Exercise Substitution - AI finds perfect alternatives
router.post("/api/ai/substitute-exercise", async (req, res) => {
  try {
    const { targetExercise, reason, availableEquipment, userLimitations } = req.body;
    
    if (!targetExercise) {
      return res.status(400).json({ error: "Target exercise is required" });
    }
    
    const substitutions = await AIWorkoutIntelligence.findIntelligentSubstitutions(
      targetExercise,
      reason || "equipment_unavailable",
      availableEquipment || ["bodyweight"],
      userLimitations || []
    );
    
    res.json(substitutions);
  } catch (error) {
    console.error("Exercise substitution error:", error);
    res.status(500).json({ error: "Failed to find exercise substitutions" });
  }
});

// 5. Personalized Meal Plan Generation - AI creates custom nutrition plans
router.post("/api/ai/generate-meal-plan", async (req, res) => {
  try {
    const userProfile = req.body;
    
    if (!userProfile.fitnessGoals || !userProfile.bodyMetrics) {
      return res.status(400).json({ error: "Fitness goals and body metrics are required" });
    }
    
    const mealPlan = await AINutritionCoach.generatePersonalizedMealPlan(userProfile);
    
    res.json(mealPlan);
  } catch (error) {
    console.error("Meal plan generation error:", error);
    res.status(500).json({ error: "Failed to generate personalized meal plan" });
  }
});

// 6. Food Photo Analysis - AI analyzes food photos for nutrition insights
router.post("/api/ai/analyze-food-photo", async (req, res) => {
  try {
    const { imageUrl, userGoals } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }
    
    const analysis = await AINutritionCoach.analyzeFoodPhoto(
      imageUrl,
      userGoals || ["general_health"]
    );
    
    res.json(analysis);
  } catch (error) {
    console.error("Food photo analysis error:", error);
    res.status(500).json({ error: "Failed to analyze food photo" });
  }
});

// 7. Performance-Based Nutrition Adjustments - AI optimizes nutrition for results
router.post("/api/ai/adjust-nutrition", async (req, res) => {
  try {
    const { workoutData, currentNutrition, performanceMetrics } = req.body;
    
    const nutritionAdjustments = await AINutritionCoach.adjustNutritionForPerformance(
      workoutData,
      currentNutrition,
      performanceMetrics
    );
    
    res.json(nutritionAdjustments);
  } catch (error) {
    console.error("Nutrition adjustment error:", error);
    res.status(500).json({ error: "Failed to adjust nutrition plan" });
  }
});

// Initialize basic recipes on first request
let recipesInitialized = false;

async function initializeBasicRecipes() {
  if (recipesInitialized) return;
  
  const fallbackRecipes = [
    {
      id: "overnight-oats-berry",
      name: "Overnight Oats with Mixed Berries",
      description: "Creamy overnight oats topped with antioxidant-rich berries and a drizzle of honey",
      ingredients: ["1/2 cup rolled oats", "1/2 cup almond milk", "1 tbsp chia seeds", "1/2 cup mixed berries", "1 tsp honey", "1/4 tsp vanilla extract"],
      instructions: ["Combine oats, almond milk, chia seeds, and vanilla in a jar", "Stir well and refrigerate overnight", "In the morning, top with berries and honey", "Enjoy cold or at room temperature"],
      prepTime: 5, cookTime: 0, servings: 1, difficulty: "easy", cuisineType: "american",
      dietaryTags: ["vegetarian", "gluten-free", "high-fiber"], calories: 280, protein: 8, carbs: 45, fat: 6, fiber: 10,
      category: "breakfast", isAiGenerated: false, createdAt: new Date(),
      tips: ["Use steel-cut oats for better texture", "Top with fresh berries for antioxidants"],
      healthBenefits: ["High in fiber and beta-glucan for heart health", "Provides sustained energy release"],
    },
    {
      id: "quinoa-power-bowl",
      name: "Mediterranean Quinoa Power Bowl",
      description: "Nutrient-packed quinoa bowl with fresh vegetables, chickpeas, and tahini dressing",
      ingredients: ["1 cup cooked quinoa", "1/2 cup chickpeas", "1/2 cucumber, diced", "1/2 cup cherry tomatoes", "1/4 cup red onion", "2 tbsp tahini", "1 lemon, juiced", "2 tbsp olive oil"],
      instructions: ["Cook quinoa according to package directions", "Dice cucumber, tomatoes, and red onion", "Whisk tahini, lemon juice, and olive oil for dressing", "Combine all ingredients in a bowl", "Drizzle with dressing and serve"],
      prepTime: 15, cookTime: 15, servings: 2, difficulty: "easy", cuisineType: "mediterranean",
      dietaryTags: ["vegan", "gluten-free", "high-protein"], calories: 380, protein: 14, carbs: 45, fat: 16, fiber: 8,
      category: "lunch", isAiGenerated: false, createdAt: new Date(),
      tips: ["Prepare quinoa in advance for quick assembly", "Add avocado for extra healthy fats"],
      healthBenefits: ["Complete protein from quinoa", "Rich in healthy fats and fiber"],
    },
    {
      id: "baked-salmon-vegetables",
      name: "Herb-Crusted Baked Salmon with Roasted Vegetables",
      description: "Flaky salmon fillet with a fresh herb crust, served with colorful roasted vegetables",
      ingredients: ["4 oz salmon fillet", "1 cup broccoli florets", "1/2 cup carrots, sliced", "1/2 zucchini, sliced", "2 tbsp olive oil", "1 tsp dried herbs", "Salt and pepper to taste"],
      instructions: ["Preheat oven to 400°F (200°C)", "Season salmon with herbs, salt, and pepper", "Toss vegetables with olive oil and seasonings", "Place salmon and vegetables on baking sheet", "Bake for 18-20 minutes until salmon flakes easily", "Serve hot"],
      prepTime: 10, cookTime: 20, servings: 1, difficulty: "medium", cuisineType: "american",
      dietaryTags: ["gluten-free", "high-protein", "omega-3"], calories: 420, protein: 35, carbs: 20, fat: 22, fiber: 8,
      category: "dinner", isAiGenerated: false, createdAt: new Date(),
      tips: ["Check salmon is flaky and opaque when done", "Don't overcook to keep it moist"],
      healthBenefits: ["Rich in omega-3 fatty acids for heart health", "High-quality protein for muscle building"],
    },
    {
      id: "green-smoothie-bowl",
      name: "Tropical Green Smoothie Bowl",
      description: "Refreshing green smoothie bowl topped with tropical fruits and crunchy granola",
      ingredients: ["1 frozen banana", "1/2 cup spinach", "1/2 cup mango chunks", "1/4 cup coconut milk", "1 tbsp chia seeds", "1/4 cup granola", "2 tbsp coconut flakes"],
      instructions: ["Blend banana, spinach, mango, and coconut milk until smooth", "Pour into a bowl", "Top with chia seeds, granola, and coconut flakes", "Serve immediately"],
      prepTime: 10, cookTime: 0, servings: 1, difficulty: "easy", cuisineType: "tropical",
      dietaryTags: ["vegan", "gluten-free", "antioxidant-rich"], calories: 320, protein: 8, carbs: 52, fat: 12, fiber: 12,
      category: "breakfast", isAiGenerated: false, createdAt: new Date(),
      tips: ["Freeze bananas ahead of time for creamier texture", "Add protein powder for extra nutrition"],
      healthBenefits: ["Packed with antioxidants from berries and greens", "Natural energy from fruits"],
    },
    {
      id: "dark-chocolate-energy-bites",
      name: "Dark Chocolate Protein Energy Bites",
      description: "No-bake energy bites with dates, almonds, and dark chocolate - perfect healthy snack",
      ingredients: ["1 cup pitted dates", "1/2 cup raw almonds", "2 tbsp cocoa powder", "1 tbsp protein powder", "1 tsp vanilla extract", "1 tbsp coconut oil"],
      instructions: ["Soak dates in warm water for 10 minutes", "Process almonds in food processor until chopped", "Add drained dates and process until paste forms", "Add cocoa powder, protein powder, vanilla, and coconut oil", "Form mixture into 12 balls", "Refrigerate for 30 minutes before serving"],
      prepTime: 20, cookTime: 0, servings: 6, difficulty: "easy", cuisineType: "american",
      dietaryTags: ["vegan", "gluten-free", "high-protein"], calories: 95, protein: 4, carbs: 12, fat: 5, fiber: 3,
      category: "snack", isAiGenerated: false, createdAt: new Date(),
      tips: ["Store in refrigerator for up to 1 week", "Roll in coconut flakes for extra flavor"],
      healthBenefits: ["Natural sweetness from dates", "Plant-based protein and healthy fats"],
    }
  ];

  for (const recipe of fallbackRecipes) {
    try {
      await storage.addRecipe(recipe);
    } catch (error) {
      console.error(`Error adding recipe ${recipe.name}:`, error);
    }
  }
  
  recipesInitialized = true;
  console.log(`✅ Initialized ${fallbackRecipes.length} healthy recipes`);
}

// Recipe routes for healthy recipe database
router.get("/api/recipes", async (req, res) => {
  try {
    await initializeBasicRecipes();
    const recipes = await storage.getAllRecipes();
    res.json(recipes);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ message: "Failed to fetch recipes" });
  }
});

router.get("/api/recipes/featured", async (req, res) => {
  try {
    await initializeBasicRecipes();
    const recipes = await storage.getRandomRecipes(6);
    res.json(recipes);
  } catch (error) {
    console.error("Error fetching featured recipes:", error);
    res.status(500).json({ message: "Failed to fetch featured recipes" });
  }
});

router.get("/api/recipes/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const recipes = await storage.getRecipesByCategory(category);
    res.json(recipes);
  } catch (error) {
    console.error("Error fetching recipes by category:", error);
    res.status(500).json({ message: "Failed to fetch recipes by category" });
  }
});

router.get("/api/recipes/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== "string") {
      return res.status(400).json({ message: "Search query is required" });
    }
    
    const recipes = await storage.searchRecipes(q);
    res.json(recipes);
  } catch (error) {
    console.error("Error searching recipes:", error);
    res.status(500).json({ message: "Failed to search recipes" });
  }
});

router.get("/api/recipes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await storage.getRecipeById(id);
    
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    
    res.json(recipe);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({ message: "Failed to fetch recipe" });
  }
});

// AI Meal Helper routes
router.post("/api/meal-helper/generate", async (req, res) => {
  try {
    const { generatePersonalizedRecipe } = await import("./ai-meal-helper");
    
    const {
      preferences,
      mealType,
      cuisineType,
      servings,
      cookingTime,
      difficulty,
      dietaryRestrictions,
      healthGoals,
      availableIngredients
    } = req.body;

    if (!preferences) {
      return res.status(400).json({ message: "Preferences are required" });
    }

    const recipe = await generatePersonalizedRecipe({
      preferences,
      mealType: mealType || "lunch",
      cuisineType,
      servings: servings || 2,
      prepTime: cookingTime || 30,
      difficulty: difficulty || "easy",
      dietaryRestrictions: dietaryRestrictions || [],
      healthGoals: healthGoals || [],
      availableIngredients: availableIngredients || []
    });

    res.json(recipe);
  } catch (error: unknown) {
    console.error("Error generating personalized recipe:", error);
    res.status(500).json({ 
      message: "Failed to generate recipe", 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.post("/api/meal-helper/generate-multiple", async (req, res) => {
  try {
    const { generateMultipleRecipes } = await import("./ai-meal-helper");
    
    const { count = 3, ...params } = req.body;

    if (!params.preferences) {
      return res.status(400).json({ message: "Preferences are required" });
    }

    const recipes = await generateMultipleRecipes(params, count);
    res.json(recipes);
  } catch (error: unknown) {
    console.error("Error generating multiple recipes:", error);
    res.status(500).json({ 
      message: "Failed to generate recipes", 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Community meals endpoints
router.post("/api/meals/share", async (req, res) => {
  try {
    const { caption, ingredients = [], calories, protein, carbs, fat, fiber, imageUrl, postToFeed = true } = req.body;
    
    const communityMeal = {
      id: require("nanoid").nanoid(),
      userId: "44595091", // Current user ID
      caption,
      imageUrl,
      ingredients,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      likes: [],
      comments: [],
      isPostedToFeed: postToFeed,
      createdAt: new Date(),
    };

    // If posting to feed, also create a post
    if (postToFeed) {
      const post = {
        id: require("nanoid").nanoid(),
        userId: "44595091",
        type: "nutrition" as const,
        caption,
        images: imageUrl ? [imageUrl] : [],
        likes: [],
        comments: [],
        createdAt: new Date(),
        nutritionData: {
          mealType: "shared_meal",
          calories: calories || 0,
          protein: protein || 0,
          carbs: carbs || 0,
          fat: fat || 0,
          fiber: fiber || 0,
          ingredients,
        }
      };
      await storage.createPost(post);
    }

    // Store the community meal
    await storage.createCommunityMeal(communityMeal);
    
    res.json(communityMeal);
  } catch (error: any) {
    console.error("Error sharing meal:", error);
    res.status(500).json({ 
      message: "Failed to share meal", 
      error: error.message 
    });
  }
});

router.get("/api/community-meals", async (req, res) => {
  try {
    const meals = await storage.getAllCommunityMeals();
    res.json(meals);
  } catch (error: any) {
    console.error("Error fetching community meals:", error);
    res.status(500).json({ 
      message: "Failed to fetch community meals", 
      error: error.message 
    });
  }
});

// Progress Insights API - AI-powered photo analysis (premium feature)
router.post('/api/progress-insights', async (req, res) => {
  try {
    const { imageUrl, userId } = req.body;
    
    if (!imageUrl || !userId) {
      return res.status(400).json({ error: 'Image URL and user ID are required' });
    }

    // Check if user has premium access
    const user = await storage.getUserById(userId);
    if (!user || (!user.isPremium && user.subscriptionTier === 'free')) {
      return res.status(403).json({ error: 'Premium subscription required for AI insights' });
    }

    // Convert image URL to base64 for OpenAI analysis
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return res.status(400).json({ error: 'Failed to fetch image from URL' });
    }
    
    const buffer = await response.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    
    // Get previous insights for context - extract analysis data from stored insights
    const storedInsights = await storage.getProgressInsightsByUserId(userId);
    const previousInsights = storedInsights.map(insight => insight.analysisData).slice(0, 2);
    
    // Analyze the image using OpenAI
    const { analyzeProgressPhoto } = await import('./ai-progress-insights');
    const analysisData = await analyzeProgressPhoto(base64Image, previousInsights);
    
    // Store the insight in database
    const insight = await storage.createProgressInsight({
      userId,
      imageUrl,
      analysisData,
    });

    res.json(insight);
  } catch (error: any) {
    console.error('Error analyzing progress photo:', error);
    res.status(500).json({ error: 'Failed to analyze progress photo' });
  }
});

// Compare two progress photos
router.post('/api/progress-insights/compare', async (req, res) => {
  try {
    const { currentImageUrl, previousImageUrl, userId, timePeriod } = req.body;
    
    if (!currentImageUrl || !previousImageUrl || !userId) {
      return res.status(400).json({ error: 'Both image URLs and user ID are required' });
    }

    // Check premium access
    const user = await storage.getUserById(userId);
    if (!user || (!user.isPremium && user.subscriptionTier === 'free')) {
      return res.status(403).json({ error: 'Premium subscription required for AI insights' });
    }

    // Fetch and convert both images to base64
    const [currentResponse, previousResponse] = await Promise.all([
      fetch(currentImageUrl),
      fetch(previousImageUrl)
    ]);

    if (!currentResponse.ok || !previousResponse.ok) {
      return res.status(400).json({ error: 'Failed to fetch one or both images' });
    }

    const currentBuffer = await currentResponse.arrayBuffer();
    const previousBuffer = await previousResponse.arrayBuffer();
    
    const currentBase64 = Buffer.from(currentBuffer).toString('base64');
    const previousBase64 = Buffer.from(previousBuffer).toString('base64');

    // Compare photos using OpenAI
    const { compareProgressPhotos } = await import('./ai-progress-insights');
    const analysisData = await compareProgressPhotos(currentBase64, previousBase64, timePeriod || '1 month');
    
    // Store the comparison insight
    const insight = await storage.createProgressInsight({
      userId,
      imageUrl: currentImageUrl,
      analysisData,
    });

    res.json(insight);
  } catch (error: any) {
    console.error('Error comparing progress photos:', error);
    res.status(500).json({ error: 'Failed to compare progress photos' });
  }
});

// Get user's progress insights history
router.get('/api/progress-insights/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const insights = await storage.getProgressInsightsByUserId(userId);
    res.json(insights);
  } catch (error: any) {
    console.error('Error fetching progress insights:', error);
    res.status(500).json({ error: 'Failed to fetch progress insights' });
  }
});

// Delete a progress insight
router.delete('/api/progress-insights/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await storage.deleteProgressInsight(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Progress insight not found' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting progress insight:', error);
    res.status(500).json({ error: 'Failed to delete progress insight' });
  }
});

export default router;
