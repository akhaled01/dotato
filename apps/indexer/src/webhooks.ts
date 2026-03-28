import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@dotato/env/server";
import { Hono } from "hono";
import type { IndexJobData } from "./workers";
import { indexQueue } from "./workers";

const verifyGitHubSignature = (body: string, signature: string): boolean => {
  const hmac = createHmac("sha256", env.GITHUB_WEBHOOK_SECRET);
  const digest = `sha256=${hmac.update(body).digest("hex")}`;
  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
};

type GitHubPushPayload = {
  ref: string;
  repository: { clone_url: string };
  commits: Array<{ added: string[]; modified: string[]; removed: string[] }>;
};

export const webhookRouter = new Hono();

webhookRouter.post("/webhook/github", async (c) => {
  const signature = c.req.header("x-hub-signature-256") ?? "";
  const body = await c.req.text();

  if (!verifyGitHubSignature(body, signature)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const event = c.req.header("x-github-event");
  if (event !== "push") return c.json({ ok: true });

  const payload = JSON.parse(body) as GitHubPushPayload;
  const changedFiles = payload.commits.flatMap((commit) => [
    ...commit.added,
    ...commit.modified,
  ]);

  const job: IndexJobData = {
    repoUrl: payload.repository.clone_url,
    branch: payload.ref,
    changedFiles,
  };

  await indexQueue.add("index-repo", job);
  return c.json({ ok: true });
});
