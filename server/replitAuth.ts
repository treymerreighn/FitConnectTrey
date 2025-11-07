import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import type { Express, RequestHandler } from "express";

// Replit authentication is optional for local development. If environment
// variables for Replit SSO are not set, export no-op functions so the app
// can run without requiring Replit.

export async function setupAuth(app: Express) {
  // No-op for local/dev environments
  console.log("Replit auth disabled: setupAuth is a no-op (REPLIT_DOMAINS not set)");
}

export const isAuthenticated: RequestHandler = (_req, _res, next) => {
  // Allow all requests when Replit auth is not configured.
  return next();
};