import type { LinkedIssue, Octokit } from "./types.ts";

export interface GetPullRequestSettings {
	number: number;
	octokit: Octokit;
	owner: string;
	repo: string;
}

export interface PullRequest {
	body: string;
	issues: LinkedIssue[];
	labels: string[];
	merged: boolean;
	state: "CLOSED" | "MERGED" | "OPEN";
}

interface PullRequestResponse {
	repository: {
		pullRequest: {
			body: string;
			closingIssuesReferences: {
				nodes: {
					number: number;
					repository: { nameWithOwner: string };
				}[];
			};
			labels: {
				nodes: { name: string }[];
			};
			merged: boolean;
			state: PullRequest["state"];
		};
	};
}

export async function getPullRequest({
	number,
	octokit,
	owner,
	repo,
}: GetPullRequestSettings): Promise<PullRequest> {
	const response = await octokit.graphql<PullRequestResponse>(
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
						labels(first: 100) {
							nodes {
								name
							}
						}
						merged
						state
					}
				}
			}
		`,
		{ number, owner, repo },
	);

	const { pullRequest } = response.repository;

	return {
		body: pullRequest.body,
		issues: pullRequest.closingIssuesReferences.nodes.map((node) => ({
			number: node.number,
			repository: node.repository.nameWithOwner,
		})),
		labels: pullRequest.labels.nodes.map((label) => label.name),
		merged: pullRequest.merged,
		state: pullRequest.state,
	};
}
