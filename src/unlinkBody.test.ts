import { describe, expect, it } from "vitest";

import { unlinkBody } from "./unlinkBody.ts";

const repository = "test-owner/test-repo";
const issue = { number: 123, repository };

describe(unlinkBody, () => {
	it("returns the body unchanged when there are no issues", () => {
		const actual = unlinkBody("Fixes #123", [], repository);

		expect(actual).toEqual({ body: "Fixes #123", unlinked: [] });
	});

	it.each([
		["Fixes #123", "Fixes `#123`"],
		["fixes #123", "fixes `#123`"],
		["closes: #123", "closes: `#123`"],
		["Resolved\t#123.", "Resolved\t`#123`."],
		["fixes test-owner/test-repo#123", "fixes `test-owner/test-repo#123`"],
		["fixes Test-Owner/Test-Repo#123", "fixes `Test-Owner/Test-Repo#123`"],
		[
			"fixes https://github.com/test-owner/test-repo/issues/123",
			"fixes `https://github.com/test-owner/test-repo/issues/123`",
		],
		[
			"- [x] fixes #123\n\nAlso closes #123",
			"- [x] fixes `#123`\n\nAlso closes `#123`",
		],
	])("unlinks %j", (body, expected) => {
		const actual = unlinkBody(body, [issue], repository);

		expect(actual).toEqual({ body: expected, unlinked: [issue] });
	});

	it.each([
		["mentions #123 without a keyword", "See #123"],
		["a longer issue number", "Fixes #1234"],
		["an issue in a different repository", "Fixes other/repo#123"],
		["a keyword suffix", "prefixes #123"],
	])("does not unlink %s", (_, body) => {
		const actual = unlinkBody(body, [issue], repository);

		expect(actual).toEqual({ body, unlinked: [] });
	});

	it("only unlinks short references for issues in the same repository", () => {
		const other = { number: 123, repository: "other/repo" };

		const actual = unlinkBody(
			"Fixes #123, fixes other/repo#123",
			[other],
			repository,
		);

		expect(actual).toEqual({
			body: "Fixes #123, fixes `other/repo#123`",
			unlinked: [other],
		});
	});

	it("unlinks multiple issues", () => {
		const second = { number: 456, repository };

		const actual = unlinkBody(
			"Fixes #123\nFixes #456",
			[issue, second],
			repository,
		);

		expect(actual).toEqual({
			body: "Fixes `#123`\nFixes `#456`",
			unlinked: [issue, second],
		});
	});
});
