
import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  console.log("Connecting to database via Neon serverless driver...");
  const sql = neon(process.env.DATABASE_URL);

  // Assuming we run from root
  const migrationFile = path.join(process.cwd(), "migrations/0000_uneven_infant_terrible.sql");
  console.log(`Reading migration file: ${migrationFile}`);
  
  const migrationSql = fs.readFileSync(migrationFile, "utf-8");
  
  // Split by statement-breakpoint to execute statements individually
  // Drizzle uses "--> statement-breakpoint" as separator
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
      // Don't exit, try to continue or inspect error
      // Some errors might be "table already exists" if partial run happened
    }
  }

  console.log("Migration completed.");
}

runMigration().catch(console.error);
