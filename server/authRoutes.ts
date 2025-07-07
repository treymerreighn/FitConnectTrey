import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPostSchema, insertCommentSchema, insertConnectionSchema, insertProgressEntrySchema, insertExerciseSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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
      const { search, category, muscleGroup } = req.query;
      let exercises;
      
      if (search) {
        exercises = await storage.searchExercises(search as string);
      } else if (category) {
        exercises = await storage.getExercisesByCategory(category as string);
      } else if (muscleGroup) {
        exercises = await storage.getExercisesByMuscleGroup(muscleGroup as string);
      } else {
        exercises = await storage.getAllExercises();
      }
      
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exercises" });
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
    try {
      const userId = req.user.claims.sub;
      const progressData = insertProgressEntrySchema.parse(req.body);
      const entry = await storage.createProgressEntry({ 
        ...progressData, 
        userId 
      });
      res.status(201).json(entry);
    } catch (error) {
      res.status(400).json({ error: "Invalid progress data" });
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

  const httpServer = createServer(app);
  return httpServer;
}