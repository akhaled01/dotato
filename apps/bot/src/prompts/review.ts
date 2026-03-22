import type { SearchResult } from "@dotato/retrieval";

export const buildReviewPrompt = (
	context: SearchResult[],
	prDiff: string,
): string => {
	const contextBlock = context
		.map((r) => `// ${r.filePath}:${r.startLine}-${r.endLine}\n${r.text}`)
		.join("\n\n---\n\n");
	return [
		"## Codebase Context",
		contextBlock,
		"",
		"## Pull Request Diff",
		prDiff,
	].join("\n");
};
