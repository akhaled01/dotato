import { createGitHubAdapter } from "@chat-adapter/github";
import { createRedisState } from "@chat-adapter/state-redis";
import { env } from "@dotato/env/server";
import { Chat } from "chat";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { onMention } from "./handlers/on-mention";
import { onReaction } from "./handlers/on-reaction";
import { onSubscribed } from "./handlers/on-subscribed";

const bot = new Chat({
	userName: "dotato-bot",
	adapters: {
		github: createGitHubAdapter({
			webhookSecret: env.GITHUB_WEBHOOK_SECRET,
			appId: env.GITHUB_APP_ID,
			privateKey: env.GITHUB_PRIVATE_KEY,
		}),
	},
	state: createRedisState({ url: env.REDIS_URL }),
});

bot.onNewMention(onMention);
bot.onSubscribedMessage(onSubscribed);
bot.onReaction(onReaction);

const app = new Hono();
app.use(logger());
app.post("/webhook/github", async (c) => {
	const event = c.req.header("x-github-event");
	console.log("[webhook] event=%s", event);
	if (event === "installation" || event === "installation_repositories") {
		return c.text("OK");
	}
	const raw = await c.req.text();
	try {
		const payload = JSON.parse(raw);
		if (event === "issue_comment") {
			console.log("[webhook] action=%s body=%s", payload.action, payload.comment?.body);
		}
	} catch {}
	return bot.webhooks.github(new Request(c.req.url, { method: "POST", headers: c.req.raw.headers, body: raw }));
});
app.get("/", (c) => c.text("OK"));

const PORT = Number(process.env.PORT ?? 3000);
Bun.serve({ fetch: app.fetch, port: PORT });
console.log(`Bot HTTP on :${PORT}`);
