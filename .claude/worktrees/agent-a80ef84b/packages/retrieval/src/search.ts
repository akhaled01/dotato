import { db } from "@dotato/db";
import { chunks, embeddings, repos } from "@dotato/db/schema";
import { env } from "@dotato/env";
import { eq, sql } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export type SearchResult = {
	text: string;
	filePath: string;
	startLine: number;
	endLine: number;
	score: number;
};

export const searchChunks = async (
	repoUrl: string,
	query: string,
	topK = 10,
): Promise<SearchResult[]> => {
	const [repo] = await db
		.select({ id: repos.id })
		.from(repos)
		.where(eq(repos.url, repoUrl))
		.limit(1);

	if (!repo) return [];

	const embeddingRes = await openai.embeddings.create({
		model: "text-embedding-3-small",
		input: query,
	});
	const queryVec = embeddingRes.data[0]?.embedding ?? [];

	const vecLiteral = `[${queryVec.join(",")}]`;

	const results = await db.execute<{
		text: string;
		file_path: string;
		start_line: number;
		end_line: number;
		score: number;
	}>(sql`
    SELECT c.text, c.file_path, c.start_line, c.end_line,
           1 - (e.embedding <=> ${sql.raw(`'${vecLiteral}'`)}::vector) AS score
    FROM ${embeddings} e
    JOIN ${chunks} c ON c.id = e.chunk_id
    WHERE c.repo_id = ${repo.id}
    ORDER BY e.embedding <=> ${sql.raw(`'${vecLiteral}'`)}::vector
    LIMIT ${topK}
  `);

	return results.rows.map((r) => ({
		text: r.text,
		filePath: r.file_path,
		startLine: r.start_line,
		endLine: r.end_line,
		score: r.score,
	}));
};
