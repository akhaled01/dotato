import { Queue, Worker } from "bullmq";
import { chunkFiles } from "./chunk/index";
import { cloneRepo } from "./clone/index";
import { embedChunks } from "./embed/index";

export type IndexJobData = {
	repoUrl: string;
	branch: string;
	changedFiles: string[];
};

const connection = {
	url: process.env.REDIS_URL ?? "redis://localhost:6379",
	maxRetriesPerRequest: null as null,
};

export const indexQueue = new Queue<IndexJobData>("index-queue", {
	connection,
});

export const indexWorker = new Worker<IndexJobData>(
	"index-queue",
	async (job) => {
		const { repoUrl, branch, changedFiles } = job.data;

		const clone = await cloneRepo(repoUrl, branch, changedFiles);
		const chunks = await chunkFiles(clone);
		await embedChunks(repoUrl, chunks);
	},
	{ connection },
);

indexWorker.on("completed", (job) => {
	console.log(`Indexed ${job.data.repoUrl}`);
});

indexWorker.on("failed", (job, err) => {
	console.error(`Failed ${job?.data.repoUrl}:`, err);
});
