import type { SearchResult } from "@dotato/retrieval";

export const buildQaPrompt = (
	context: SearchResult[],
	question: string,
): string => {
	const contextBlock = context
		.map((r) => `// ${r.filePath}:${r.startLine}-${r.endLine}\n${r.text}`)
		.join("\n\n---\n\n");
	return [
		"## Codebase Context",
		contextBlock,
		"",
		"## Question",
		question,
	].join("\n");
};
