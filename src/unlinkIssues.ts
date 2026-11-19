import * as core from "@actions/core";

import type { PullRequest } from "./getPullRequest.ts";
import type { ActionContext, LinkedIssue, Octokit } from "./types.ts";

import { unlinkBody } from "./unlinkBody.ts";

export interface UnlinkIssuesSettings {
	context: ActionContext;
	number: number;
	octokit: Octokit;
	pullRequest: Pick<PullRequest, "body" | "issues">;
}

export async function unlinkIssues({
	context,
	number,
	octokit,
	pullRequest,
}: UnlinkIssuesSettings) {
	const { body, issues } = pullRequest;

	if (!issues.length) {
		core.info("No linked issues.");
		return;
	}

	const { owner, repo } = context.repo;
	const updated = unlinkBody(body, issues, `${owner}/${repo}`);

	if (updated.unlinked.length) {
		await octokit.rest.pulls.update({
			body: updated.body,
			owner,
			pull_number: number,
			repo,
		});

		core.info(`Unlinked: ${updated.unlinked.map(formatIssue).join(", ")}`);
	}

	const remaining = issues.filter((issue) => !updated.unlinked.includes(issue));

	if (remaining.length) {
		core.warning(
			`Could not unlink ${remaining.map(formatIssue).join(", ")}. They may have been linked manually, which GitHub's API can't undo.`,
		);
	}
}

function formatIssue(issue: LinkedIssue) {
	return `${issue.repository}#${issue.number}`;
}
