import type * as github from "@actions/github";

export type ActionContext = Pick<
	typeof github.context,
	"eventName" | "payload" | "repo"
>;

export interface LinkedIssue {
	number: number;

	/**
	 * Repository the issue is in, as `owner/name`.
	 */
	repository: string;
}

export type Octokit = ReturnType<typeof github.getOctokit>;
