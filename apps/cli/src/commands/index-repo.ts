import { Queue } from "bullmq";

import { resolveConfig } from "../config.js";

type IndexJobData = { repoUrl: string; branch: string; changedFiles: string[] };

export const cmdIndex = async (
	repoUrl: string,
	branch: string,
): Promise<void> => {
	const queue = new Queue<IndexJobData>("index-queue", {
		connection: {
			url: resolveConfig().redisUrl,
			maxRetriesPerRequest: null as null,
		},
	});

	const job = await queue.add("index-repo", {
		repoUrl,
		branch,
		changedFiles: [],
	});
	await queue.close();

	console.log(`Queued job ${job.id}`);
	console.log(`  repo:   ${repoUrl}`);
	console.log(`  branch: ${branch}`);
};
