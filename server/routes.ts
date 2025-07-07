import { Router } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { insertUserSchema, insertPostSchema, insertCommentSchema, insertConnectionSchema, insertProgressEntrySchema, insertExerciseSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";

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

router.post("/api/posts", async (req, res) => {
  try {
    const postData = insertPostSchema.parse(req.body);
    const post = await storage.createPost(postData);
    res.status(201).json(post);
  } catch (error) {
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
  try {
    const entryData = insertProgressEntrySchema.parse(req.body);
    const entry = await storage.createProgressEntry(entryData);
    res.status(201).json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create progress entry" });
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

router.post("/api/progress/:id/ai-insights", async (req, res) => {
  try {
    const { photos } = req.body;
    const entry = await storage.generateAIInsights(req.params.id, photos || []);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate AI insights" });
  }
});

// Exercise library endpoints
router.get("/api/exercises", async (req, res) => {
  try {
    const { category, muscleGroup, search } = req.query;
    
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
  } catch (error) {
    console.error("Error creating exercise:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid exercise data", details: error.errors });
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
  } catch (error) {
    console.error("Error updating exercise:", error);
    if (error.message === "Exercise not found") {
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
  } catch (error) {
    console.error("Error approving exercise:", error);
    if (error.message === "Exercise not found") {
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

export default router;
