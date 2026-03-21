import { env } from "@dotato/env/server";
import { App } from "octokit";

const app = new App({
	appId: env.GITHUB_APP_ID,
	privateKey: env.GITHUB_PRIVATE_KEY,
});

export const getInstallationToken = async (
	owner: string,
	repo: string,
): Promise<string> => {
	const { data: installation } = await app.octokit.request(
		"GET /repos/{owner}/{repo}/installation",
		{ owner, repo },
	);

	const octokit = await app.getInstallationOctokit(installation.id);
	const auth = (await octokit.auth({ type: "installation" })) as {
		token: string;
	};

	return auth.token;
};
