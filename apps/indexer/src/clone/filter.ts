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

export const isExcluded = (relativePath: string): boolean => {
	const segments = relativePath.split("/");
	const filename = segments[segments.length - 1] ?? "";

	for (const segment of segments.slice(0, -1)) {
		if (EXCLUDED_DIRS.has(segment)) return true;
	}

	if (EXCLUDED_FILENAMES.has(filename)) return true;

	const dotIdx = filename.lastIndexOf(".");
	if (dotIdx !== -1 && EXCLUDED_EXTENSIONS.has(filename.slice(dotIdx)))
		return true;

	return false;
};
