import { db, pool } from "@dotato/db/client";
import { repos } from "@dotato/db/schema";
import { asc } from "drizzle-orm";

export const cmdList = async (): Promise<void> => {
	const rows = await db.select().from(repos).orderBy(asc(repos.indexedAt));
	await pool.end();

	if (rows.length === 0) {
		console.log("No repos indexed yet. Run: dotato index <repo-url>");
		return;
	}

	const col = (s: string, w: number) => s.slice(0, w).padEnd(w);
	const header = `${col("URL", 50)}  ${col("BRANCH", 24)}  INDEXED AT`;
	const divider = "-".repeat(header.length);

	console.log(header);
	console.log(divider);
	for (const r of rows) {
		const indexed = r.indexedAt
			? r.indexedAt.toISOString().replace("T", " ").slice(0, 19)
			: "never";
		console.log(`${col(r.url, 50)}  ${col(r.branch, 24)}  ${indexed}`);
	}
	console.log(divider);
	console.log(`${rows.length} repo${rows.length === 1 ? "" : "s"}`);
};
