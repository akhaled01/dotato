import { execFile as execFileCb } from "node:child_process";
import { access, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { promisify } from "node:util";
import { App } from "octokit";

const execFile = promisify(execFileCb);

const app = new App({
	appId: process.env.GITHUB_APP_ID!,
	privateKey: process.env.GITHUB_PRIVATE_KEY!,
});

export type CloneResult = {
	dir: string;
	files: string[];
};

const EXCLUDED_DIRS = new Set([
	"node_modules",
	".git",
	"dist",
	"build",
	".turbo",
]);

const EXCLUDED_FILENAMES = new Set([
	"pnpm-lock.yaml",
	"yarn.lock",
	"package-lock.json",
	"bun.lockb",
]);

const EXCLUDED_EXTENSIONS = new Set([
	".png",
	".jpg",
	".jpeg",
	".gif",
	".svg",
	".ico",
	".woff",
	".woff2",
	".ttf",
	".eot",
	".mp4",
	".mp3",
	".zip",
	".tar",
	".gz",
	".exe",
	".bin",
]);

const parseRepoUrl = (repoUrl: string): { owner: string; repo: string } => {
	const cleaned = repoUrl.replace(/\.git$/, "");
	const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)$/);
	if (!match) throw new Error(`Cannot parse GitHub URL: ${repoUrl}`);
	return { owner: match[1], repo: match[2] };
};

const shortBranch = (branch: string): string =>
	branch.replace(/^refs\/heads\//, "");

const dirExists = async (path: string): Promise<boolean> => {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
};

const isExcluded = (relativePath: string): boolean => {
	const segments = relativePath.split("/");
	const filename = segments[segments.length - 1];

	for (const segment of segments.slice(0, -1)) {
		if (EXCLUDED_DIRS.has(segment)) return true;
	}

	if (EXCLUDED_FILENAMES.has(filename)) return true;

	const dotIdx = filename.lastIndexOf(".");
	if (dotIdx !== -1) {
		const ext = filename.slice(dotIdx);
		if (EXCLUDED_EXTENSIONS.has(ext)) return true;
	}

	return false;
};

export const cloneRepo = async (
	repoUrl: string,
	branch: string,
	changedFiles: string[],
): Promise<CloneResult> => {
	const { owner, repo } = parseRepoUrl(repoUrl);
	const branchName = shortBranch(branch);

	const { data: installation } = await app.octokit.request(
		"GET /repos/{owner}/{repo}/installation",
		{ owner, repo },
	);

	const octokit = await app.getInstallationOctokit(installation.id);

	const auth = (await octokit.auth({ type: "installation" })) as {
		token: string;
	};
	const authUrl = `https://x-access-token:${auth.token}@github.com/${owner}/${repo}.git`;

	const dir = join(tmpdir(), `dotato-${owner}-${repo}`);
	const exists = await dirExists(dir);

	if (!exists) {
		await execFile("git", [
			"clone",
			"--depth",
			"1",
			"--branch",
			branchName,
			authUrl,
			dir,
		]);
	} else {
		await execFile("git", ["-C", dir, "fetch", "origin"]);
		await execFile("git", [
			"-C",
			dir,
			"reset",
			"--hard",
			`origin/${branchName}`,
		]);
	}

	const entries = await readdir(dir, { recursive: true });

	const allFiles = entries
		.map((entry) => {
			const rel = typeof entry === "string" ? entry : entry.toString();
			return { rel, abs: join(dir, rel) };
		})
		.filter(({ rel }) => !isExcluded(rel))
		.map(({ abs }) => abs);

	if (changedFiles.length === 0) {
		return { dir, files: allFiles };
	}

	const changedSet = new Set(changedFiles);
	const filtered = allFiles.filter((abs) => {
		const rel = relative(dir, abs);
		return changedSet.has(rel);
	});

	return { dir, files: filtered };
};
