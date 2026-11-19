import type { LinkedIssue, Octokit } from "./types.ts";

export interface GetLinkedIssuesSettings {
	number: number;
	octokit: Octokit;
	owner: string;
	repo: string;
}

interface LinkedIssuesResponse {
	repository: {
		pullRequest: {
			body: string;
			closingIssuesReferences: {
				nodes: {
					number: number;
					repository: { nameWithOwner: string };
				}[];
			};
		};
	};
}

export async function getLinkedIssues({
	number,
	octokit,
	owner,
	repo,
}: GetLinkedIssuesSettings) {
	const response = await octokit.graphql<LinkedIssuesResponse>(
		`
			query ($owner: String!, $repo: String!, $number: Int!) {
				repository(owner: $owner, name: $repo) {
					pullRequest(number: $number) {
						body
						closingIssuesReferences(first: 100) {
							nodes {
								number
								repository {
									nameWithOwner
								}
							}
						}
					}
				}
			}
		`,
		{ number, owner, repo },
	);

	const { pullRequest } = response.repository;

	return {
		body: pullRequest.body,
		issues: pullRequest.closingIssuesReferences.nodes.map(
			(node): LinkedIssue => ({
				number: node.number,
				repository: node.repository.nameWithOwner,
			}),
		),
	};
}
