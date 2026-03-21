import { runMigrations } from "@dotato/db/migrate";
import { Hono } from "hono";
import { webhookRouter } from "./webhooks";
import { indexWorker } from "./workers";

const PORT = Number(process.env.PORT ?? 3001);

const init = async (): Promise<void> => {
	try {
		await runMigrations();
		console.log("Migrations complete");
	} catch (err) {
		console.warn(
			"Migrations skipped (run db:generate + db:migrate):",
			(err as Error).message,
		);
	}

	const app = new Hono();
	app.route("/", webhookRouter);

	Bun.serve({ fetch: app.fetch, port: PORT });
	console.log(`Indexer HTTP on :${PORT}`);
	console.log("BullMQ worker ready (queue: index-queue)");
};

// indexWorker is imported for its side-effect (registers event handlers + starts processing)
void indexWorker;

init().catch((err: unknown) => {
	console.error("Startup failed:", err);
	process.exit(1);
});

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
