import { db } from "@dotato/db";
import { feedback } from "@dotato/db/schema";

export const onReaction = async (
	thread: unknown,
	reaction: unknown,
): Promise<void> => {
	const t = thread as { repoUrl?: string; messageId?: string };
	const r = reaction as { emoji: string };

	const value = r.emoji === "+1" ? 1 : r.emoji === "-1" ? -1 : null;
	if (value === null) return;

	await db.insert(feedback).values({
		repoUrl: t.repoUrl ?? "",
		messageId: t.messageId ?? "",
		value,
	});
};
