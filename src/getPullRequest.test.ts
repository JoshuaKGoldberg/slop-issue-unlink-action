import { describe, expect, it, vi } from "vitest";

import type { Octokit } from "./types.ts";

import { getPullRequest } from "./getPullRequest.ts";

describe(getPullRequest, () => {
	it("returns the pull request's body, closing issues, labels, and state", async () => {
		const graphql = vi.fn().mockResolvedValue({
			repository: {
				pullRequest: {
					body: "Fixes #123",
					closingIssuesReferences: {
						nodes: [
							{
								number: 123,
								repository: { nameWithOwner: "test-owner/test-repo" },
							},
						],
					},
					labels: { nodes: [{ name: "slop" }] },
					merged: false,
					state: "CLOSED",
				},
			},
		});

		const actual = await getPullRequest({
			number: 1,
			octokit: { graphql } as unknown as Octokit,
			owner: "test-owner",
			repo: "test-repo",
		});

		expect(actual).toEqual({
			body: "Fixes #123",
			issues: [{ number: 123, repository: "test-owner/test-repo" }],
			labels: ["slop"],
			merged: false,
			state: "CLOSED",
		});
		expect(graphql).toHaveBeenCalledWith(expect.any(String), {
			number: 1,
			owner: "test-owner",
			repo: "test-repo",
		});
	});
});
