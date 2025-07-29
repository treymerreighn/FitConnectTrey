import express from "express";
import cors from "cors";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";
import { registerRoutes } from "./authRoutes";
import { initializeDatabase } from "./db";
import { storage } from "./storage";
import { buildFreshExerciseLibrary } from "./fresh-exercise-builder";
import { expandExerciseLibrary } from "./expand-exercise-library";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

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

    server.listen(PORT, "0.0.0.0", () => {
      log(`Server running at http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
