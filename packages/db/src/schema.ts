import {
	integer,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-core/columns/vector_extension/vector";

export const repos = pgTable("repos", {
	id: uuid("id").primaryKey().defaultRandom(),
	url: text("url").unique().notNull(),
	branch: text("branch").notNull(),
	indexedAt: timestamp("indexed_at"),
});

export const chunks = pgTable("chunks", {
	id: uuid("id").primaryKey().defaultRandom(),
	repoId: uuid("repo_id")
		.notNull()
		.references(() => repos.id, { onDelete: "cascade" }),
	filePath: text("file_path").notNull(),
	startLine: integer("start_line").notNull(),
	endLine: integer("end_line").notNull(),
	text: text("text").notNull(),
});

export const embeddings = pgTable(
	"embeddings",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		chunkId: uuid("chunk_id")
			.notNull()
			.references(() => chunks.id, { onDelete: "cascade" }),
		embedding: vector({ dimensions: 1536 }),
	},
	(t) => [unique().on(t.chunkId)],
);

export const feedback = pgTable("feedback", {
	id: uuid("id").primaryKey().defaultRandom(),
	repoUrl: text("repo_url").notNull(),
	messageId: text("message_id").notNull(),
	value: integer("value").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
