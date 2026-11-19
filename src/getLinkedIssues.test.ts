import { describe, expect, it, vi } from "vitest";

import type { Octokit } from "./types.ts";

import { getLinkedIssues } from "./getLinkedIssues.ts";

describe(getLinkedIssues, () => {
	it("returns the body and closing issue references", async () => {
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
				},
			},
		});

		const actual = await getLinkedIssues({
			number: 1,
			octokit: { graphql } as unknown as Octokit,
			owner: "test-owner",
			repo: "test-repo",
		});

		expect(actual).toEqual({
			body: "Fixes #123",
			issues: [{ number: 123, repository: "test-owner/test-repo" }],
		});
		expect(graphql).toHaveBeenCalledWith(expect.any(String), {
			number: 1,
			owner: "test-owner",
			repo: "test-repo",
		});
	});
});
