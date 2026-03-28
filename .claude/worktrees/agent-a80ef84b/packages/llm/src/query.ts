import { generateObject, jsonSchema } from "ai";
import { chatModel } from "./models";

type QueryExpansion = { queries: [string, string, string] };

export const expandQuery = async (input: string): Promise<string[]> => {
	const result = await generateObject<QueryExpansion>({
		model: chatModel,
		schema: jsonSchema<QueryExpansion>({
			type: "object",
			properties: {
				queries: {
					type: "array",
					items: { type: "string" },
					minItems: 3,
					maxItems: 3,
				},
			},
			required: ["queries"],
		}),
		prompt: `Generate 3 diverse search queries to retrieve relevant code context for this question/task. Return only the queries array.\n\nInput: ${input}`,
	});
	return result.object.queries;
};
