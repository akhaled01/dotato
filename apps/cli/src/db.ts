import { drizzle } from "drizzle-orm/node-postgres";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import pg from "pg";

export const repos = pgTable("repos", {
	id: uuid("id").primaryKey().defaultRandom(),
	url: text("url").notNull().unique(),
	branch: text("branch").notNull().default("refs/heads/main"),
	indexedAt: timestamp("indexed_at"),
});

export const chunks = pgTable("chunks", {
	id: uuid("id").primaryKey().defaultRandom(),
	repoId: uuid("repo_id").notNull(),
	filePath: text("file_path").notNull(),
	startLine: integer("start_line").notNull(),
	endLine: integer("end_line").notNull(),
	text: text("text").notNull(),
});

export const embeddings = pgTable("embeddings", {
	id: uuid("id").primaryKey().defaultRandom(),
	chunkId: uuid("chunk_id").notNull(),
});

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error(
		"DATABASE_URL is not set. Does a .env file exist in the current directory?",
	);
}

export const pool = new pg.Pool({ connectionString });
export const db = drizzle(pool);
