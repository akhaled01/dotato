import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

type DotatoConfig = {
	databaseUrl: string;
	redisUrl: string;
};

const CONFIG_PATH = join(homedir(), ".dotato", "config.json");

const readConfig = (): DotatoConfig | undefined => {
	if (!existsSync(CONFIG_PATH)) return undefined;
	try {
		return JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as DotatoConfig;
	} catch {
		return undefined;
	}
};

const writeConfig = (cfg: DotatoConfig): void => {
	mkdirSync(join(homedir(), ".dotato"), { recursive: true });
	writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
};

const resolveConfig = (): DotatoConfig => {
	const databaseUrl = process.env.DATABASE_URL;
	const redisUrl = process.env.REDIS_URL;
	if (databaseUrl && redisUrl) return { databaseUrl, redisUrl };

	const saved = readConfig();
	if (saved) {
		return {
			databaseUrl: databaseUrl ?? saved.databaseUrl,
			redisUrl: redisUrl ?? saved.redisUrl,
		};
	}

	throw new Error("dotato is not configured. Run: dotato configure");
};

export type { DotatoConfig };
export { readConfig, resolveConfig, writeConfig };
