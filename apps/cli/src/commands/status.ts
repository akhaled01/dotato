import { db, pool } from "@dotato/db/client";
import { chunks, embeddings, repos } from "@dotato/db/schema";
import { count, eq } from "drizzle-orm";

export const cmdStatus = async (repoUrl: string): Promise<void> => {
	const [repo] = await db
		.select()
		.from(repos)
		.where(eq(repos.url, repoUrl))
		.limit(1);

	if (!repo) {
		await pool.end();
		console.error(`Repo not found: ${repoUrl}`);
		console.error("Run: dotato index <repo-url>  to add it");
		process.exit(1);
	}

	const [chunkRow] = await db
		.select({ n: count() })
		.from(chunks)
		.where(eq(chunks.repoId, repo.id));

	const [embeddingRow] = await db
		.select({ n: count() })
		.from(embeddings)
		.innerJoin(chunks, eq(embeddings.chunkId, chunks.id))
		.where(eq(chunks.repoId, repo.id));

	await pool.end();

	console.log(`Repo:       ${repo.url}`);
	console.log(`Branch:     ${repo.branch}`);
	console.log(`Indexed at: ${repo.indexedAt?.toISOString() ?? "never"}`);
	console.log(`Chunks:     ${chunkRow?.n ?? 0}`);
	console.log(`Embeddings: ${embeddingRow?.n ?? 0}`);
};
