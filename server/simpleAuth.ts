import type { Express, RequestHandler } from "express";
import { storage } from "./storage.ts";

// Simple development authentication that works reliably
const CURRENT_USER = {
  id: "44595091",
  email: "steinbraden@gmail.com",
  firstName: "Stein",
  lastName: "Braden",
  profileImageUrl: undefined,
  isAdmin: true, // Dev user is admin for testing admin features
};

export async function setupSimpleAuth(app: Express) {
  // Create the user in storage
  await storage.upsertUser(CURRENT_USER);
  
  // Simple auth endpoints for development
  app.get("/api/login", (req, res) => {
    // Set a simple session flag
    (req as any).session = (req as any).session || {};
    (req as any).session.userId = CURRENT_USER.id;
    res.redirect("/");
  });

  app.get("/api/logout", (req, res) => {
    // Clear session
    if ((req as any).session) {
      (req as any).session.userId = null;
    }
    res.redirect("/");
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const userId = (req as any).session?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Fetch user to ensure they exist
  const user = await storage.getUserById(userId);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  (req as any).user = {
    claims: {
      sub: user.id,
      email: user.email,
      first_name: (user as any).firstName,
      last_name: (user as any).lastName,
    }
  };
  next();
};