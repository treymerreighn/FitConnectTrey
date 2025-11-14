import type { Express, RequestHandler } from "express";
import { storage } from "./storage.ts";

// Simple development authentication that works reliably
const CURRENT_USER = {
  id: "44595091",
  email: "steinbraden@gmail.com",
  firstName: "Stein",
  lastName: "Braden",
  profileImageUrl: undefined,
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
  // For development, always authenticate with the current user
  console.log("Simple auth - user authenticated");
  (req as any).user = {
    claims: {
      sub: CURRENT_USER.id,
      email: CURRENT_USER.email,
      first_name: CURRENT_USER.firstName,
      last_name: CURRENT_USER.lastName,
    }
  };
  next();
};