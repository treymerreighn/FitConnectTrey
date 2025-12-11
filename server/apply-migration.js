
import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

async function runMigration() {
  // Load .env manually
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    envConfig.split("\n").forEach((line) => {
      const [key, value] = line.split("=");
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  console.log("Connecting to database via Neon serverless driver...");
  const sql = neon(process.env.DATABASE_URL);

  const migrationFile = path.join(process.cwd(), "migrations/0000_uneven_infant_terrible.sql");
  console.log(`Reading migration file: ${migrationFile}`);
  
  const migrationSql = fs.readFileSync(migrationFile, "utf-8");
  
  const statements = migrationSql.split("--> statement-breakpoint");

  console.log(`Found ${statements.length} statements to execute.`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement) continue;

    console.log(`Executing statement ${i + 1}...`);
    try {
      await sql(statement);
    } catch (err) {
      console.error(`Error executing statement ${i + 1}:`, err);
    }
  }

  console.log("Migration completed.");
}

runMigration().catch(console.error);
