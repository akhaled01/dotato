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
	userName: "dotato",
	adapters: {
		github: createGitHubAdapter({ webhookSecret: env.GITHUB_WEBHOOK_SECRET }),
	},
	state: createRedisState({ url: env.REDIS_URL }),
});

bot.onNewMention(onMention);
bot.onSubscribedMessage(onSubscribed);
bot.onReaction(onReaction);

const app = new Hono();
app.use(logger());
app.post("/webhook/github", (c) => bot.webhooks.github(c.req.raw));
app.get("/", (c) => c.text("OK"));

const PORT = Number(process.env["PORT"] ?? 3000);
Bun.serve({ fetch: app.fetch, port: PORT });
console.log(`Bot HTTP on :${PORT}`);
