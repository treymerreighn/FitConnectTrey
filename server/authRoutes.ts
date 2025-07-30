import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupSimpleAuth, isAuthenticated } from "./simpleAuth";
import { insertPostSchema, insertCommentSchema, insertConnectionSchema, insertProgressEntrySchema, insertExerciseSchema, insertWorkoutSessionSchema, insertExerciseProgressSchema } from "@shared/schema";
import multer from "multer";
import { AWSImageService } from "./aws-config";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import { generateAIWorkout } from "./ai-workout";
import { generateExerciseInsights, generateWorkoutVolumeInsights } from "./ai-exercise-insights";
import { generatePersonalizedRecipe } from "./ai-meal-helper";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupSimpleAuth(app);

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    },
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserById(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public routes (no auth required)
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
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

  app.put("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.get("/api/posts/user/:userId", async (req, res) => {
    try {
      const posts = await storage.getPostsByUserId(req.params.userId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user posts" });
    }
  });

  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await storage.getAllPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/trending", async (req, res) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const posts = await storage.getTrendingWorkouts(hours);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trending posts" });
    }
  });

  app.get("/api/exercises", async (req, res) => {
    try {
      console.log("Fetching exercises...");
      const { search, category, muscleGroup } = req.query;
      let exercises;
      
      // Direct SQL query to get exercises from database
      const exerciseResults = await db.execute(sql`
        SELECT id, name, category, muscle_groups as "muscleGroups", equipment, difficulty, 
               description, instructions, tips, images, videos, variations, tags, 
               is_approved as "isApproved", created_by as "createdBy", created_at as "createdAt"
        FROM exercises 
        WHERE is_approved = true
      `);
      exercises = exerciseResults.rows;
      
      console.log(`Found ${exercises.length} exercises`);
      res.json(exercises);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  });

  app.post('/api/exercises', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exerciseData = {
        ...req.body,
        createdBy: userId,
        isUserCreated: true,
        isApproved: false // User-created exercises need approval
      };
      
      const exercise = await storage.createExercise(exerciseData);
      res.json(exercise);
    } catch (error) {
      console.error('Error creating exercise:', error);
      res.status(500).json({ message: 'Failed to create exercise' });
    }
  });

  // Protected routes (require authentication)
  app.post("/api/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postData = insertPostSchema.parse(req.body);
      const post = await storage.createPost({ ...postData, userId });
      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({ error: "Invalid post data" });
    }
  });

  app.post("/api/posts/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;
      const post = await storage.likePost(postId, userId);
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: "Failed to like post" });
    }
  });

  app.post("/api/posts/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;
      const commentData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment({ 
        ...commentData, 
        postId, 
        userId 
      });
      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ error: "Invalid comment data" });
    }
  });

  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByPostId(req.params.id);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/connections", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connectionData = insertConnectionSchema.parse(req.body);
      const connection = await storage.createConnection({ 
        ...connectionData, 
        clientId: userId 
      });
      res.status(201).json(connection);
    } catch (error) {
      res.status(400).json({ error: "Invalid connection data" });
    }
  });

  app.get("/api/connections", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connections = await storage.getConnectionsByClientId(userId);
      res.json(connections);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch connections" });
    }
  });

  app.get("/api/professionals", async (req, res) => {
    try {
      const type = req.query.type as "trainer" | "nutritionist" | undefined;
      const professionals = await storage.getProfessionals(type);
      res.json(professionals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch professionals" });
    }
  });

  app.post("/api/progress", isAuthenticated, async (req: any, res) => {
    console.log("🚨 Progress endpoint hit!");
    console.log("Raw request body:", req.body);
    console.log("User from auth:", req.user.claims.sub);
    
    try {
      const userId = req.user.claims.sub;
      
      // Ensure date is properly parsed and handle defaults
      const requestData = { 
        ...req.body,
        photos: req.body.photos || [],
        isPrivate: req.body.isPrivate !== undefined ? req.body.isPrivate : true
      };
      
      if (typeof requestData.date === 'string') {
        requestData.date = new Date(requestData.date);
      }
      
      console.log("Processed request data:", requestData);
      
      const progressData = insertProgressEntrySchema.parse(requestData);
      console.log("Schema validation passed:", progressData);
      
      const entry = await storage.createProgressEntry({ 
        ...progressData, 
        userId 
      });
      
      console.log("Progress entry created:", entry);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Progress creation error:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Invalid progress data" });
    }
  });

  app.get("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = await storage.getProgressEntriesByUserId(userId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress entries" });
    }
  });

  app.post("/api/progress/:id/insights", isAuthenticated, async (req: any, res) => {
    try {
      const entryId = req.params.id;
      const { photos } = req.body;
      const entry = await storage.generateAIInsights(entryId, photos);
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate insights" });
    }
  });

  // Exercise library API
  app.get("/api/exercises", async (req, res) => {
    try {
      const { category, muscleGroup, search } = req.query;
      let exercises = await storage.getAllExercises();
      
      // Filter by category
      if (category && typeof category === 'string') {
        exercises = exercises.filter(ex => ex.category === category);
      }
      
      // Filter by muscle group
      if (muscleGroup && typeof muscleGroup === 'string') {
        exercises = exercises.filter(ex => 
          ex.muscleGroups && ex.muscleGroups.includes(muscleGroup)
        );
      }
      
      // Search by name
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        exercises = exercises.filter(ex => 
          ex.name.toLowerCase().includes(searchLower) ||
          (ex.description && ex.description.toLowerCase().includes(searchLower))
        );
      }
      
      res.json(exercises);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  });

  app.get("/api/exercises/:id", async (req, res) => {
    try {
      const exercise = await storage.getExerciseById(req.params.id);
      if (!exercise) {
        return res.status(404).json({ error: "Exercise not found" });
      }
      res.json(exercise);
    } catch (error) {
      console.error("Error fetching exercise:", error);
      res.status(500).json({ error: "Failed to fetch exercise" });
    }
  });

  app.post("/api/exercises", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exerciseData = insertExerciseSchema.parse(req.body);
      const exercise = await storage.createExercise({ 
        ...exerciseData, 
        createdBy: userId 
      });
      res.status(201).json(exercise);
    } catch (error) {
      res.status(400).json({ error: "Invalid exercise data" });
    }
  });

  // Image upload endpoint
  app.post('/api/upload', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const result = await AWSImageService.uploadImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      res.json({
        success: true,
        url: result.publicUrl,
        key: result.key,
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ 
        message: "Failed to upload image",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Multiple images upload endpoint
  app.post('/api/upload-multiple', isAuthenticated, upload.array('images', 5), async (req: any, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const uploadPromises = req.files.map((file: any) =>
        AWSImageService.uploadImage(file.buffer, file.originalname, file.mimetype)
      );

      const results = await Promise.all(uploadPromises);

      res.json({
        success: true,
        urls: results.map(r => r.publicUrl),
        keys: results.map(r => r.key),
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      res.status(500).json({ message: "Failed to upload images" });
    }
  });

  // Workout session tracking endpoints
  app.post("/api/workout-sessions", isAuthenticated, async (req: any, res) => {
    try {
      const sessionData = insertWorkoutSessionSchema.parse(req.body);
      const session = await storage.createWorkoutSession({ 
        ...sessionData, 
        userId: req.user.claims.sub 
      });
      res.status(201).json(session);
    } catch (error) {
      console.error("Workout session creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create workout session" });
    }
  });

  app.get("/api/workout-sessions", isAuthenticated, async (req: any, res) => {
    try {
      const sessions = await storage.getWorkoutSessionsByUserId(req.user.claims.sub);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workout sessions" });
    }
  });

  app.get("/api/exercise-progress/:exerciseId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exerciseId = req.params.exerciseId;
      const progressData = await storage.getExerciseProgressChart(userId, exerciseId);
      res.json(progressData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exercise progress" });
    }
  });

  app.get("/api/workout-volume-chart", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const volumeData = await storage.getWorkoutVolumeChart(userId);
      res.json(volumeData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workout volume data" });
    }
  });

  app.get("/api/personal-records", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const records = await storage.getUserPersonalRecords(userId);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch personal records" });
    }
  });

  app.get("/api/exercise-insights/:exerciseId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exerciseId = req.params.exerciseId;
      
      // Get exercise details
      const exercise = await storage.getExerciseById(exerciseId);
      if (!exercise) {
        return res.status(404).json({ error: "Exercise not found" });
      }

      // Get progress data for the exercise
      const progressData = await storage.getExerciseProgressByExercise(userId, exerciseId);
      
      // Generate AI insights
      const insights = await generateExerciseInsights(exercise.name, progressData);
      
      res.json(insights);
    } catch (error) {
      console.error("Exercise insights error:", error);
      res.status(500).json({ error: "Failed to generate exercise insights" });
    }
  });

  app.get("/api/volume-insights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const volumeData = await storage.getWorkoutVolumeChart(userId);
      const insights = await generateWorkoutVolumeInsights(volumeData);
      res.json(insights);
    } catch (error) {
      console.error("Volume insights error:", error);
      res.status(500).json({ error: "Failed to generate volume insights" });
    }
  });

  // AI Workout Generation
  app.post("/api/generate-workout", isAuthenticated, async (req, res) => {
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

  // AI Meal Helper routes
  app.post("/api/meal-helper/generate", async (req, res) => {
    try {
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
        cookingTime: cookingTime || 30,
        difficulty: difficulty || "easy",
        dietaryRestrictions: dietaryRestrictions || [],
        healthGoals: healthGoals || [],
        availableIngredients: availableIngredients || []
      });

      res.json(recipe);
    } catch (error) {
      console.error("Error generating personalized recipe:", error);
      res.status(500).json({ 
        message: "Failed to generate recipe", 
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}