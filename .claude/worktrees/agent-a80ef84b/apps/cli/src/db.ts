import { drizzle } from "drizzle-orm/node-postgres";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import pg from "pg";

import { resolveConfig } from "./config.js";

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

const { databaseUrl } = resolveConfig();

export const pool = new pg.Pool({ connectionString: databaseUrl });
export const db = drizzle(pool);
