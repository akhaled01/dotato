import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		REDIS_URL: z.url().default("redis://localhost:6380"),
		CORS_ORIGIN: z.url().optional(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		GITHUB_APP_ID: z.string().min(1),
		GITHUB_PRIVATE_KEY: z.string().min(1),
		GITHUB_WEBHOOK_SECRET: z.string().min(1),
		OPENAI_API_KEY: z.string().min(1),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
