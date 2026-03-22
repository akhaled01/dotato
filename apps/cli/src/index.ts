#!/usr/bin/env bun
import "./setup.js";

import { parseArgs } from "node:util";

import { cmdConfigure } from "./commands/configure.js";
import { cmdIndex } from "./commands/index-repo.js";
import { cmdList } from "./commands/list.js";
import { cmdStatus } from "./commands/status.js";
import { BANNER, gitCurrentBranch, gitRemoteUrl, HELP } from "./util.js";

const [, , command, ...rest] = process.argv;

if (!command || command === "--help" || command === "-h") {
	console.log(HELP);
	process.exit(0);
}

console.log(`\n${BANNER}\n`);

const run = async (): Promise<void> => {
	if (command === "index") {
		const { positionals, values } = parseArgs({
			args: rest,
			options: { branch: { type: "string", short: "b" } },
			allowPositionals: true,
		});
		const repoUrl = positionals[0] ?? gitRemoteUrl();
		if (!repoUrl) {
			console.error(
				`Error: repo-url required (no git remote origin found)\n\n${HELP}`,
			);
			process.exit(1);
		}
		await cmdIndex(repoUrl, values.branch ?? gitCurrentBranch());
	} else if (command === "list") {
		await cmdList();
	} else if (command === "status") {
		const repoUrl = rest[0];
		if (!repoUrl) {
			console.error(`Error: repo-url required\n\n${HELP}`);
			process.exit(1);
		}
		await cmdStatus(repoUrl);
	} else if (command === "configure") {
		await cmdConfigure();
	} else {
		console.error(`Unknown command: ${command}\n\n${HELP}`);
		process.exit(1);
	}
};

run().catch((err: unknown) => {
	console.error("Error:", err instanceof Error ? err.message : err);
	process.exit(1);
});
