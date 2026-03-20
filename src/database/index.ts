import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import postgres from "postgres";

// export const database = drizzle(process.env.DATABASE_URL!, { schema });

const connectionString = process.env.DATABASE_URL!;

// prepare: false is required for Supabase Transaction pooler (pgBouncer)
const client = postgres(connectionString, { prepare: false });

export const database = drizzle(client, { schema });
