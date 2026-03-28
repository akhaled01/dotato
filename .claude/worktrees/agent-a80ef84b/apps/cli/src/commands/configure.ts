import type { Interface } from "node:readline";
import { createInterface } from "node:readline";

import { readConfig, writeConfig } from "../config.js";

const prompt = (rl: Interface, question: string): Promise<string> =>
	new Promise((resolve) => rl.question(question, resolve));

export const cmdConfigure = async (): Promise<void> => {
	const existing = readConfig();
	const rl = createInterface({ input: process.stdin, output: process.stdout });

	const databaseUrl = await prompt(
		rl,
		`Postgres URL${existing?.databaseUrl ? ` [${existing.databaseUrl}]` : ""}: `,
	);
	const redisUrl = await prompt(
		rl,
		`Redis URL${existing?.redisUrl ? ` [${existing.redisUrl}]` : ""}: `,
	);
	rl.close();

	writeConfig({
		databaseUrl: (databaseUrl.trim() || existing?.databaseUrl) ?? "",
		redisUrl:
			(redisUrl.trim() || existing?.redisUrl) ?? "redis://localhost:6379",
	});

	console.log("Configuration saved to ~/.dotato/config.json");
};
