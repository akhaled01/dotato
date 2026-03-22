import type { SearchResult } from "@dotato/retrieval";
import { generateText, streamText } from "ai";
import { chatModel } from "./models";

const buildSystemPrompt = (context: SearchResult[]): string => {
	const contextBlock = context
		.map((r) => `// ${r.filePath}:${r.startLine}-${r.endLine}\n${r.text}`)
		.join("\n\n---\n\n");
	return [
		"You are an expert on this codebase. Answer questions clearly and concisely.",
		"Reference specific files and line numbers where relevant.",
		"",
		"## Codebase Context",
		contextBlock,
	].join("\n");
};

export const streamAnswer = (context: SearchResult[], question: string) =>
	streamText({
		model: chatModel,
		system: buildSystemPrompt(context),
		prompt: question,
	});

export const generateAnswer = async (
	context: SearchResult[],
	question: string,
): Promise<string> => {
	const result = await generateText({
		model: chatModel,
		system: buildSystemPrompt(context),
		prompt: question,
	});
	return result.text;
};
