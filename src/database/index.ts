import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import postgres from "postgres";

let _database: ReturnType<typeof drizzle> | null = null;

export function getDatabase() {
  if (_database) return _database;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  try {
    // prepare: false is required for Supabase Transaction pooler (pgBouncer)
    const client = postgres(connectionString, { prepare: false });
    _database = drizzle(client, { schema });
    return _database;
  } catch (error) {
    throw new Error(
      `Failed to initialize database: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
