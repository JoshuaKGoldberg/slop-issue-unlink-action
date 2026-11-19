import * as core from "@actions/core";

import type { ActionContext, LinkedIssue, Octokit } from "./types.ts";

import { getLinkedIssues } from "./getLinkedIssues.ts";
import { unlinkBody } from "./unlinkBody.ts";

export interface UnlinkIssuesSettings {
	context: ActionContext;
	number: number;
	octokit: Octokit;
}

export async function unlinkIssues({
	context,
	number,
	octokit,
}: UnlinkIssuesSettings) {
	const { owner, repo } = context.repo;
	const { body, issues } = await getLinkedIssues({
		number,
		octokit,
		owner,
		repo,
	});

	if (!issues.length) {
		core.info("No linked issues.");
		return;
	}

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
