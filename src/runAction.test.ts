import * as core from "@actions/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ActionContext } from "./types.ts";

import { runAction } from "./runAction.ts";
import { unlinkIssues } from "./unlinkIssues.ts";

vi.mock("@actions/core");
vi.mock("@actions/github", () => ({
	getOctokit: vi.fn((token: string) => ({ token })),
}));
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

const slopPullRequest = {
	labels: [{ name: "other" }, { name: "slop" }],
	merged: false,
	number: 1,
	state: "closed",
};

describe(runAction, () => {
	beforeEach(() => {
		vi.mocked(core.getInput).mockReturnValue("test-token");
		vi.mocked(core.getMultilineInput).mockReturnValue(["slop", "spam"]);
	});

	it.each(["issues", "push"])(
		"throws on unsupported %s events",
		async (eventName) => {
			await expect(
				runAction(createContext(slopPullRequest, eventName)),
			).rejects.toThrow(`Unsupported event: ${eventName}.`);
		},
	);

	it("throws when there is no pull request in the payload", async () => {
		await expect(runAction(createContext(undefined))).rejects.toThrow(
			"No pull request found in the event payload.",
		);
	});

	it.each([
		["still open", { state: "open" }],
		["merged", { merged: true }],
		["not labeled as slop", { labels: [{ name: "other" }] }],
	])("skips a pull request that is %s", async (_, overrides) => {
		await runAction(createContext({ ...slopPullRequest, ...overrides }));

		expect(unlinkIssues).not.toHaveBeenCalled();
	});

	it.each(["pull_request", "pull_request_target"])(
		"unlinks issues from a closed, unmerged slop pull request on %s",
		async (eventName) => {
			const context = createContext(slopPullRequest, eventName);

			await runAction(context);

			expect(unlinkIssues).toHaveBeenCalledWith({
				context,
				number: 1,
				octokit: { token: "test-token" },
			});
		},
	);
});
