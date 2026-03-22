import { db } from "@dotato/db";
import { feedback } from "@dotato/db/schema";

export const onReaction = async (event: unknown): Promise<void> => {
	const e = event as {
		messageId: string;
		rawEmoji: string;
		thread?: { repoUrl?: string };
	};

	const value = e.rawEmoji === "+1" ? 1 : e.rawEmoji === "-1" ? -1 : null;
	if (value === null) return;

	await db.insert(feedback).values({
		repoUrl: e.thread?.repoUrl ?? "",
		messageId: e.messageId,
		value,
	});
};
