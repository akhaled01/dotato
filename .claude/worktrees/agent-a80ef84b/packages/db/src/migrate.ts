import { migrate } from "drizzle-orm/node-postgres/migrator";

import { db, pool } from "./client.ts";

export const runMigrations = async (): Promise<void> => {
	await migrate(db, { migrationsFolder: "./migrations" });
	await pool.end();
};
