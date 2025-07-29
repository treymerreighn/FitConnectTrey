import express from "express";
import cors from "cors";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";
import { registerRoutes } from "./authRoutes";
import { initializeDatabase } from "./db";
import { buildBasicExerciseLibrary } from "./simple-exercise-builder";
import { generateComprehensiveExerciseLibrary } from "./generate-exercise-library";

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
    console.log("🏗️ Building exercise library...");
    
    // Try to generate comprehensive exercise library with OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        await generateComprehensiveExerciseLibrary();
      } catch (error) {
        console.log("⚠️ AI exercise generation failed, falling back to basic library");
        await buildBasicExerciseLibrary();
      }
    } else {
      console.log("ℹ️ No OpenAI API key found, using basic exercise library");
      await buildBasicExerciseLibrary();
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
