import { generateAnswer, streamAnswer } from "@dotato/llm/qa";
import { expandQuery } from "@dotato/llm/query";
import type { SearchResult } from "@dotato/retrieval";
import { searchChunks } from "@dotato/retrieval";

const dedupeResults = (results: SearchResult[]): SearchResult[] => {
	const seen = new Map<string, SearchResult>();
	for (const r of results) {
		const key = `${r.filePath}:${r.startLine}`;
		const existing = seen.get(key);
		if (!existing || r.score > existing.score) seen.set(key, r);
	}
	return [...seen.values()].sort((a, b) => b.score - a.score).slice(0, 10);
};

export const onSubscribed = async (
	thread: unknown,
	message: unknown,
): Promise<void> => {
	const t = thread as {
		post: (text: string) => Promise<void>;
		streamPost: (stream: unknown) => Promise<void>;
		adapter: string;
		repoUrl?: string;
	};
	const msg = message as { text: string };

	const repoUrl = t.repoUrl ?? "";
	const queries = await expandQuery(msg.text);
	const rawResults = await Promise.all(
		queries.map((q) => searchChunks(repoUrl, q, 5)),
	);
	const context = dedupeResults(rawResults.flat());

	if (t.adapter === "github") {
		await t.post(await generateAnswer(context, msg.text));
	} else {
		await t.streamPost(streamAnswer(context, msg.text));
	}
};
