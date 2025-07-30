import express from "express";
import cors from "cors";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";
import { registerRoutes } from "./authRoutes";
import { initializeDatabase } from "./db";
import { storage } from "./storage";
import { buildFreshExerciseLibrary } from "./fresh-exercise-builder";
import { expandExerciseLibrary } from "./expand-exercise-library";
import { applyProductionOptimizations, setupMemoryMonitoring, setupGracefulShutdown } from "./production-optimizations";
import { requestTimer, requestSizeLimiter, simpleRateLimit, healthCheck } from "./middleware/performance";

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Reasonable payload limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static("public"));

// Apply production optimizations
applyProductionOptimizations(app);

// Performance middleware
app.use(requestTimer);
app.use(requestSizeLimiter);
app.use('/api', simpleRateLimit(200, 60000)); // 200 requests per minute for API routes

// Health check endpoint
app.get('/health', healthCheck);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Build exercise library
    if (process.env.OPENAI_API_KEY) {
      // Check if we already have a good exercise library
      const existingExercises = await storage.getAllExercises();
      if (existingExercises.length >= 30) {
        console.log(`✅ Exercise library already has ${existingExercises.length} exercises - server ready!`);
      } else {
        console.log("🚀 Building fresh exercise library with OpenAI in background...");
        // Build library in background to not block server startup
        setTimeout(async () => {
          try {
            await buildFreshExerciseLibrary();
            await expandExerciseLibrary();
            console.log("🎯 Complete exercise library ready!");
            
            // Seed workout data for demo
            const { seedWorkoutData } = await import("./seed-workout-data");
            await seedWorkoutData();
          } catch (error) {
            console.log("⚠️ Exercise generation failed, using existing library");
          }
        }, 1000);
      }
    } else {
      console.log("❌ No OpenAI API key found - cannot build exercise library");
      throw new Error("OpenAI API key required for exercise library generation");
    }
    
    // Register routes with authentication
    const server = await registerRoutes(app);
    
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      await setupVite(app, server);
    }

    server.listen(Number(PORT), "0.0.0.0", () => {
      log(`Server running at http://0.0.0.0:${PORT}`);
      
      // Setup production monitoring
      setupMemoryMonitoring();
      setupGracefulShutdown(server);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
