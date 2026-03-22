import type { SearchResult } from "@dotato/retrieval";
import { generateText, streamText } from "ai";
import { chatModel, reasonerModel } from "./models.ts";

type ReviewOptions = { deep?: boolean };

const buildSystemPrompt = (context: SearchResult[]): string => {
	const contextBlock = context
		.map((r) => `// ${r.filePath}:${r.startLine}-${r.endLine}\n${r.text}`)
		.join("\n\n---\n\n");
	return [
		"You are a senior software engineer performing a code review.",
		"You have access to relevant codebase context below.",
		"Focus on correctness, security, performance, and maintainability.",
		"Be concise and actionable.",
		"",
		"## Codebase Context",
		contextBlock,
	].join("\n");
};

export const streamReview = (
	context: SearchResult[],
	prDiff: string,
	options: ReviewOptions = {},
) =>
	streamText({
		model: options.deep ? reasonerModel : chatModel,
		system: buildSystemPrompt(context),
		prompt: `Review this pull request diff:\n\n${prDiff}`,
	});

export const generateReview = async (
	context: SearchResult[],
	prDiff: string,
	options: ReviewOptions = {},
): Promise<string> => {
	const result = await generateText({
		model: options.deep ? reasonerModel : chatModel,
		system: buildSystemPrompt(context),
		prompt: `Review this pull request diff:\n\n${prDiff}`,
	});
	return result.text;
};
