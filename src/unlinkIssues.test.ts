import * as core from "@actions/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ActionContext, Octokit } from "./types.ts";

import { getLinkedIssues } from "./getLinkedIssues.ts";
import { unlinkIssues } from "./unlinkIssues.ts";

vi.mock("@actions/core");
vi.mock("./getLinkedIssues.ts");

const context = {
	repo: { owner: "test-owner", repo: "test-repo" },
} as ActionContext;

const issue = { number: 123, repository: "test-owner/test-repo" };

describe(unlinkIssues, () => {
	const update = vi.fn();
	const octokit = { rest: { pulls: { update } } } as unknown as Octokit;

	beforeEach(() => {
		update.mockReset();
	});

	it("does nothing when there are no linked issues", async () => {
		vi.mocked(getLinkedIssues).mockResolvedValue({
			body: "Fixes #123",
			issues: [],
		});

		await unlinkIssues({ context, number: 1, octokit });

		expect(update).not.toHaveBeenCalled();
		expect(core.info).toHaveBeenCalledWith("No linked issues.");
	});

	it("updates the body when issues are unlinked", async () => {
		vi.mocked(getLinkedIssues).mockResolvedValue({
			body: "Fixes #123",
			issues: [issue],
		});

		await unlinkIssues({ context, number: 1, octokit });

		expect(update).toHaveBeenCalledWith({
			body: "Fixes `#123`",
			owner: "test-owner",
			pull_number: 1,
			repo: "test-repo",
		});
		expect(core.info).toHaveBeenCalledWith(
			"Unlinked: test-owner/test-repo#123",
		);
		expect(core.warning).not.toHaveBeenCalled();
	});

	it("warns about issues that could not be unlinked", async () => {
		vi.mocked(getLinkedIssues).mockResolvedValue({
			body: "No references here.",
			issues: [issue],
		});

		await unlinkIssues({ context, number: 1, octokit });

		expect(update).not.toHaveBeenCalled();
		expect(core.warning).toHaveBeenCalledWith(
			"Could not unlink test-owner/test-repo#123. They may have been linked manually, which GitHub's API can't undo.",
		);
	});
});
