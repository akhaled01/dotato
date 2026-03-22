import { execSync } from "node:child_process";

export const BANNER = `
  ██████╗  ██████╗ ████████╗ █████╗ ████████╗ ██████╗
  ██╔══██╗██╔═══██╗╚══██╔══╝██╔══██╗╚══██╔══╝██╔═══██╗
  ██║  ██║██║   ██║   ██║   ███████║   ██║   ██║   ██║
  ██║  ██║██║   ██║   ██║   ██╔══██║   ██║   ██║   ██║
  ██████╔╝╚██████╔╝   ██║   ██║  ██║   ██║   ╚██████╔╝
  ╚═════╝  ╚═════╝    ╚═╝   ╚═╝  ╚═╝   ╚═╝    ╚═════╝
  ai code review & codebase Q&A
`.trim();

export const HELP = `
${BANNER}

Usage:
  dotato index [<repo-url>] [--branch <branch>]
    Enqueue a full reindex job. Defaults to the current repo's
    origin URL and active branch when run from a git repo.

  dotato list
    List all indexed repos with their branch and last index time.

  dotato status <repo-url>
    Show chunk and embedding counts for a specific repo.

  dotato --help
    Show this help.

Options:
  -b, --branch <ref>   Git ref to index (e.g. refs/heads/main)

Examples:
  dotato index
  dotato index https://github.com/org/repo
  dotato index https://github.com/org/repo --branch refs/heads/dev
  dotato list
  dotato status https://github.com/org/repo
`.trim();

export const gitRemoteUrl = (): string | undefined => {
	try {
		return execSync("git remote get-url origin", { stdio: ["ignore", "pipe", "ignore"] })
			.toString()
			.trim();
	} catch {
		return undefined;
	}
};

export const gitCurrentBranch = (): string => {
	try {
		const branch = execSync("git branch --show-current", { stdio: ["ignore", "pipe", "ignore"] })
			.toString()
			.trim();
		return branch ? `refs/heads/${branch}` : "refs/heads/main";
	} catch {
		return "refs/heads/main";
	}
};
