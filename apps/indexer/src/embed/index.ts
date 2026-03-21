import { db } from "@dotato/db";
import {
	chunks as chunksTable,
	embeddings as embeddingsTable,
	repos,
} from "@dotato/db/schema";
import { env } from "@dotato/env/server";
import { and, eq, inArray } from "drizzle-orm";
import OpenAI from "openai";
import type { Chunk } from "../chunk/index";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const EMBED_BATCH = 100;

const batchEmbed = async (texts: string[]): Promise<number[][]> => {
	const vectors: number[][] = [];
	for (let i = 0; i < texts.length; i += EMBED_BATCH) {
		const batch = texts.slice(i, i + EMBED_BATCH);
		const res = await openai.embeddings.create({
			model: "text-embedding-3-small",
			input: batch,
		});
		vectors.push(...res.data.map((d) => d.embedding));
	}
	return vectors;
};

export const embedChunks = async (
	repoUrl: string,
	branch: string,
	chunks: Chunk[],
): Promise<void> => {
	if (chunks.length === 0) return;

	// Upsert repo
	const [repo] = await db
		.insert(repos)
		.values({ url: repoUrl, branch, indexedAt: new Date() })
		.onConflictDoUpdate({ target: repos.url, set: { indexedAt: new Date() } })
		.returning({ id: repos.id });

	if (!repo) throw new Error(`Failed to upsert repo: ${repoUrl}`);

	// Delete stale chunks for affected files (cascade removes embeddings)
	const filePaths = [...new Set(chunks.map((c) => c.filePath))];
	await db
		.delete(chunksTable)
		.where(
			and(
				eq(chunksTable.repoId, repo.id),
				inArray(chunksTable.filePath, filePaths),
			),
		);

	// Insert chunks
	const inserted = await db
		.insert(chunksTable)
		.values(
			chunks.map((c) => ({
				repoId: repo.id,
				filePath: c.filePath,
				startLine: c.startLine,
				endLine: c.endLine,
				text: c.text,
			})),
		)
		.returning({ id: chunksTable.id });

	// Generate embeddings
	const vectors = await batchEmbed(chunks.map((c) => c.text));

	// Insert embeddings
	await db.insert(embeddingsTable).values(
		inserted.map((row, i) => ({
			chunkId: row.id,
			embedding: vectors[i] ?? [],
		})),
	);
};
