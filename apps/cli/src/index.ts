#!/usr/bin/env bun
import "./setup.js";
import { parseArgs } from "node:util";
import { cmdIndex } from "./commands/index-repo.js";
import { cmdList } from "./commands/list.js";
import { cmdStatus } from "./commands/status.js";

const HELP = `
dotato — Dotato CLI

Usage:
  dotato index <repo-url> [--branch <branch>]   Enqueue a full index job
  dotato list                                    List all indexed repos
  dotato status <repo-url>                       Show chunk/embedding counts for a repo
  dotato --help                                  Show this help

Examples:
  dotato index https://github.com/org/repo --branch main
  dotato list
  dotato status https://github.com/org/repo
`.trim();

const [, , command, ...rest] = process.argv;

if (!command || command === "--help" || command === "-h") {
	console.log(HELP);
	process.exit(0);
}

const run = async (): Promise<void> => {
	if (command === "index") {
		const { positionals, values } = parseArgs({
			args: rest,
			options: {
				branch: { type: "string", short: "b", default: "refs/heads/main" },
			},
			allowPositionals: true,
		});
		const repoUrl = positionals[0];
		if (!repoUrl) {
			console.error(`Error: repo-url required\n\n${HELP}`);
			process.exit(1);
		}
		await cmdIndex(repoUrl, values.branch ?? "refs/heads/main");
	} else if (command === "list") {
		await cmdList();
	} else if (command === "status") {
		const repoUrl = rest[0];
		if (!repoUrl) {
			console.error(`Error: repo-url required\n\n${HELP}`);
			process.exit(1);
		}
		await cmdStatus(repoUrl);
	} else {
		console.error(`Unknown command: ${command}\n\n${HELP}`);
		process.exit(1);
	}
};

run().catch((err: unknown) => {
	console.error("Error:", err instanceof Error ? err.message : err);
	process.exit(1);
});
