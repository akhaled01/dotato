import { execFile as execFileCb } from "node:child_process";
import { access, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { promisify } from "node:util";
import { getInstallationToken } from "./auth";
import { isExcluded } from "./filter";

const execFile = promisify(execFileCb);

export type CloneResult = {
	dir: string;
	files: string[];
};

const parseRepoUrl = (repoUrl: string): { owner: string; repo: string } => {
	const cleaned = repoUrl.replace(/\.git$/, "");
	const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)$/);
	if (!match) throw new Error(`Cannot parse GitHub URL: ${repoUrl}`);
	const [, owner, repo] = match;
	if (!owner || !repo) throw new Error(`Cannot parse GitHub URL: ${repoUrl}`);
	return { owner, repo };
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

export const cloneRepo = async (
	repoUrl: string,
	branch: string,
	changedFiles: string[],
): Promise<CloneResult> => {
	const { owner, repo } = parseRepoUrl(repoUrl);
	const branchName = shortBranch(branch);

	const token = await getInstallationToken(owner, repo);
	const authUrl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;

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

	const entries = (await readdir(dir, { recursive: true })) as string[];

	const allFiles = entries
		.map((rel) => ({ rel, abs: join(dir, rel) }))
		.filter(({ rel }) => !isExcluded(rel))
		.map(({ abs }) => abs);

	if (changedFiles.length === 0) return { dir, files: allFiles };

	const changedSet = new Set(changedFiles);
	return {
		dir,
		files: allFiles.filter((abs) => changedSet.has(relative(dir, abs))),
	};
};
