import * as core from "@actions/core";
import * as github from "@actions/github";

import type { ActionContext } from "./types.ts";

import { unlinkIssues } from "./unlinkIssues.ts";

export async function runAction(context: ActionContext) {
	if (
		context.eventName !== "pull_request" &&
		context.eventName !== "pull_request_target"
	) {
		throw new Error(
			`Unsupported event: ${context.eventName}. Run this action on pull_request_target.`,
		);
	}

	const { pull_request: pullRequest } = context.payload;
	if (!pullRequest) {
		throw new Error("No pull request found in the event payload.");
	}

	if (pullRequest.state !== "closed") {
		core.info("Pull request is still open; skipping.");
		return;
	}

	if (pullRequest.merged) {
		core.info("Pull request was merged; skipping.");
		return;
	}

	const labels = core.getMultilineInput("labels", { required: true });
	const pullRequestLabels = (pullRequest.labels as { name: string }[]).map(
		(label) => label.name,
	);
	if (!pullRequestLabels.some((label) => labels.includes(label))) {
		core.info("Pull request has no slop labels; skipping.");
		return;
	}

	const octokit = github.getOctokit(
		core.getInput("github-token", { required: true }),
	);

	await unlinkIssues({ context, number: pullRequest.number, octokit });
}
