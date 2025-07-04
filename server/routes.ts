import { Router } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { insertUserSchema, insertPostSchema, insertCommentSchema } from "@shared/schema";

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

export default router;
