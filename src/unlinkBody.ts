import type { LinkedIssue } from "./types.ts";

// https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword
const keywords = [
	"close",
	"closes",
	"closed",
	"fix",
	"fixes",
	"fixed",
	"resolve",
	"resolves",
	"resolved",
];

export interface UnlinkedBody {
	body: string;
	unlinked: LinkedIssue[];
}

/**
 * Wraps closing references to issues in code spans so GitHub no longer links them.
 * For example, "fixes #123" becomes "fixes `#123`".
 */
export function unlinkBody(
	body: string,
	issues: LinkedIssue[],
	repository: string,
): UnlinkedBody {
	const unlinked: LinkedIssue[] = [];

	for (const issue of issues) {
		const pattern = new RegExp(
			`(\\b(?:${keywords.join("|")}):?\\s+)(${createReferences(issue, repository).join("|")})(?![\\w/])`,
			"gi",
		);
		const updated = body.replaceAll(pattern, "$1`$2`");

		if (updated !== body) {
			body = updated;
			unlinked.push(issue);
		}
	}

	return { body, unlinked };
}

function createReferences(issue: LinkedIssue, repository: string) {
	const escaped = escapeRegExp(issue.repository);
	const references = [
		`${escaped}#${issue.number}`,
		`https://github\\.com/${escaped}/issues/${issue.number}`,
	];

	if (issue.repository.toLowerCase() === repository.toLowerCase()) {
		references.push(`#${issue.number}`);
	}

	return references;
}

function escapeRegExp(text: string) {
	return text.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}
