import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../shared/db-schema.ts";

let sql: any = null;
export let db: any = null;

// Initialize database only if DATABASE_URL is provided
// App will work in development without a database (using in-memory storage)
if (process.env.DATABASE_URL) {
  try {
    sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql, { schema });
    console.log('✅ Connected to PostgreSQL database');
  } catch (error) {
    console.warn('⚠️  Database connection failed, falling back to in-memory storage');
    sql = null;
    db = null;
  }
}

// Create tables if they don't exist (no-op when DATABASE_URL not provided)
export async function initializeDatabase() {
  if (!sql) {
    console.log("DATABASE_URL not set; skipping database initialization (using in-memory storage)");
    return;
  }

  try {
    // Create sessions table for authentication
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP NOT NULL
      )
    `;

    // Create index on sessions expire column for cleanup
    await sql`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire)
    `;

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        bio TEXT,
        avatar TEXT,
        is_verified BOOLEAN DEFAULT false,
        account_type TEXT NOT NULL DEFAULT 'user',
        fitness_goals TEXT[] DEFAULT '{}',
        followers TEXT[] DEFAULT '{}',
        following TEXT[] DEFAULT '{}',
        location TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create posts table
    await sql`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        caption TEXT NOT NULL,
        images TEXT[] DEFAULT '{}',
        likes TEXT[] DEFAULT '{}',
        comments TEXT[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        workout_data JSONB,
        nutrition_data JSONB,
        progress_data JSONB
      )
    `;

    // Create comments table
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL REFERENCES posts(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create connections table
    await sql`
      CREATE TABLE IF NOT EXISTS connections (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL REFERENCES users(id),
        professional_id TEXT NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        request_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create progress_entries table
    await sql`
      CREATE TABLE IF NOT EXISTS progress_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        date TIMESTAMP NOT NULL,
        type TEXT NOT NULL,
        weight INTEGER,
        body_fat INTEGER,
        muscle_mass INTEGER,
        measurements JSONB,
        photos TEXT[] DEFAULT '{}',
        notes TEXT,
        mood TEXT,
        energy_level INTEGER,
        ai_insights TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create exercises table
    await sql`
      CREATE TABLE IF NOT EXISTS exercises (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        instructions TEXT[] DEFAULT '{}',
        category TEXT NOT NULL,
        muscle_groups TEXT[] DEFAULT '{}',
        equipment TEXT[] DEFAULT '{}',
        difficulty TEXT NOT NULL,
        image_url TEXT,
        video_url TEXT,
        tips TEXT[] DEFAULT '{}',
        created_by TEXT REFERENCES users(id),
        is_approved BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log("✅ Database tables initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    console.warn("⚠️  Falling back to in-memory storage");
    // Reset db and sql to null so storage will use MemStorage
    db = null;
    sql = null;
  }
}