import * as core from "@actions/core";
import * as github from "@actions/github";

import type { ActionContext } from "./types.ts";

import { getPullRequest } from "./getPullRequest.ts";
import { unlinkIssues } from "./unlinkIssues.ts";

export async function runAction(context: ActionContext) {
	if (context.eventName === "issues") {
		core.info("Not a pull request event; skipping.");
		return;
	}

	if (
		context.eventName !== "pull_request" &&
		context.eventName !== "pull_request_target"
	) {
		throw new Error(
			`Unsupported event: ${context.eventName}. Run this action on pull_request_target.`,
		);
	}

	const number = (
		context.payload.pull_request as undefined | { number?: number }
	)?.number;
	if (!number) {
		throw new Error("No pull request found in the event payload.");
	}

	const labels = core.getMultilineInput("labels", { required: true });
	const octokit = github.getOctokit(
		core.getInput("github-token", { required: true }),
	);

	// The event payload may be stale if an earlier step just closed or labeled the PR.
	const pullRequest = await getPullRequest({
		number,
		octokit,
		...context.repo,
	});

	if (pullRequest.state === "OPEN") {
		core.info("Pull request is still open; skipping.");
		return;
	}

	if (pullRequest.merged) {
		core.info("Pull request was merged; skipping.");
		return;
	}

	if (!pullRequest.labels.some((label) => labels.includes(label))) {
		core.info("Pull request has no slop labels; skipping.");
		return;
	}

	await unlinkIssues({ context, number, octokit, pullRequest });
}
