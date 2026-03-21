import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { chunks, embeddings, repos } from "./schema.ts";

export const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, {
	schema: { repos, chunks, embeddings },
});
