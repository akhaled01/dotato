import { readFile } from "node:fs/promises";
import { extname, relative } from "node:path";
import type { CloneResult } from "../clone/index";

export type Chunk = {
	text: string;
	filePath: string;
	startLine: number;
	endLine: number;
};

const CHUNK_LINES = 40;
const OVERLAP_LINES = 4;

const CODE_EXTENSIONS = new Set([
	".ts",
	".tsx",
	".js",
	".jsx",
	".py",
	".rs",
	".go",
	".java",
	".cpp",
	".c",
	".rb",
	".cs",
	".sh",
	".md",
	".yaml",
	".yml",
	".json",
	".toml",
	".html",
	".css",
	".scss",
	".sql",
]);

const splitIntoChunks = (lines: string[], filePath: string): Chunk[] => {
	const chunks: Chunk[] = [];
	let i = 0;

	while (i < lines.length) {
		const startLine = i + 1; // 1-indexed
		const endIdx = Math.min(i + CHUNK_LINES, lines.length);
		const text = lines.slice(i, endIdx).join("\n");

		if (text.trim().length > 0) {
			chunks.push({ text, filePath, startLine, endLine: endIdx });
		}

		if (endIdx >= lines.length) break;
		i = endIdx - OVERLAP_LINES;
	}

	return chunks;
};

export const chunkFiles = async (clone: CloneResult): Promise<Chunk[]> => {
	const results: Chunk[] = [];

	for (const absPath of clone.files) {
		const ext = extname(absPath);
		if (!CODE_EXTENSIONS.has(ext)) continue;

		const content = await readFile(absPath, "utf-8");
		const filePath = relative(clone.dir, absPath);
		const lines = content.split("\n");
		const chunks = splitIntoChunks(lines, filePath);
		results.push(...chunks);
	}

	return results;
};
