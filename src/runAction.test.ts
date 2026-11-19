import * as core from "@actions/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PullRequest } from "./getPullRequest.ts";
import type { ActionContext } from "./types.ts";

import { getPullRequest } from "./getPullRequest.ts";
import { runAction } from "./runAction.ts";
import { unlinkIssues } from "./unlinkIssues.ts";

vi.mock("@actions/core");
vi.mock("@actions/github", () => ({
	getOctokit: vi.fn((token: string) => ({ token })),
}));
vi.mock("./getPullRequest.ts");
vi.mock("./unlinkIssues.ts");

function createContext(
	pullRequest: Record<string, unknown> | undefined,
	eventName = "pull_request_target",
): ActionContext {
	return {
		eventName,
		payload: { pull_request: pullRequest },
		repo: { owner: "test-owner", repo: "test-repo" },
	} as ActionContext;
}

const slopPullRequest: PullRequest = {
	body: "Fixes #123",
	issues: [{ number: 123, repository: "test-owner/test-repo" }],
	labels: ["other", "slop"],
	merged: false,
	state: "CLOSED",
};

describe(runAction, () => {
	beforeEach(() => {
		vi.mocked(core.getInput).mockReturnValue("test-token");
		vi.mocked(core.getMultilineInput).mockReturnValue(["slop", "spam"]);
		vi.mocked(getPullRequest).mockResolvedValue(slopPullRequest);
	});

	it("skips issues events, such as when run after AgentScan", async () => {
		await runAction(createContext(undefined, "issues"));

		expect(getPullRequest).not.toHaveBeenCalled();
		expect(core.info).toHaveBeenCalledWith(
			"Not a pull request event; skipping.",
		);
	});

	it.each(["issue_comment", "push"])(
		"throws on unsupported %s events",
		async (eventName) => {
			await expect(
				runAction(createContext({ number: 1 }, eventName)),
			).rejects.toThrow(`Unsupported event: ${eventName}.`);
		},
	);

	it("throws when there is no pull request in the payload", async () => {
		await expect(runAction(createContext(undefined))).rejects.toThrow(
			"No pull request found in the event payload.",
		);
	});

	it("reads the pull request's current state rather than the payload's", async () => {
		const context = createContext({ number: 1, state: "open" });

		await runAction(context);

		expect(getPullRequest).toHaveBeenCalledWith({
			number: 1,
			octokit: { token: "test-token" },
			owner: "test-owner",
			repo: "test-repo",
		});
		expect(unlinkIssues).toHaveBeenCalledWith({
			context,
			number: 1,
			octokit: { token: "test-token" },
			pullRequest: slopPullRequest,
		});
	});

	it.each<[string, Partial<PullRequest>]>([
		["still open", { state: "OPEN" }],
		["merged", { merged: true, state: "MERGED" }],
		["not labeled as slop", { labels: ["other"] }],
	])("skips a pull request that is %s", async (_, overrides) => {
		vi.mocked(getPullRequest).mockResolvedValue({
			...slopPullRequest,
			...overrides,
		});

		await runAction(createContext({ number: 1 }));

		expect(unlinkIssues).not.toHaveBeenCalled();
	});

	it.each(["pull_request", "pull_request_target"])(
		"unlinks issues from a closed, unmerged slop pull request on %s",
		async (eventName) => {
			await runAction(createContext({ number: 1 }, eventName));

			expect(unlinkIssues).toHaveBeenCalledOnce();
		},
	);
});
