import type { CloneResult } from "../clone/index";

export type Chunk = {
	text: string;
	filePath: string;
	startLine: number;
	endLine: number;
};

export const chunkFiles = async (_clone: CloneResult): Promise<Chunk[]> => {
	throw new Error("TODO");
};
