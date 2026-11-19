<h1 align="center">Slop Issue Unlink Action</h1>

<p align="center">
	Unlinks issues from closed, unmerged slop pull requests.
	⛓️‍💥
</p>

<p align="center">
	<!-- prettier-ignore-start -->
	<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
	<a href="#contributors" target="_blank"><img alt="👪 All Contributors: 1" src="https://img.shields.io/badge/%F0%9F%91%AA_all_contributors-1-21bb42.svg" /></a>
<!-- ALL-CONTRIBUTORS-BADGE:END -->
	<!-- prettier-ignore-end -->
	<a href="https://github.com/JoshuaKGoldberg/slop-issue-unlink-action/blob/main/.github/CODE_OF_CONDUCT.md" target="_blank"><img alt="🤝 Code of Conduct: Kept" src="https://img.shields.io/badge/%F0%9F%A4%9D_code_of_conduct-kept-21bb42" /></a>
	<a href="https://codecov.io/gh/JoshuaKGoldberg/slop-issue-unlink-action" target="_blank"><img alt="🧪 Coverage" src="https://img.shields.io/codecov/c/github/JoshuaKGoldberg/slop-issue-unlink-action?label=%F0%9F%A7%AA%20coverage" /></a>
	<a href="https://github.com/JoshuaKGoldberg/slop-issue-unlink-action/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg" /></a>
	<img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
</p>

## Usage

When a pull request is closed without being merged, GitHub keeps showing it as linked from any issues it [closes with a keyword](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword) such as `fixes #123`.
That's noisy when the pull request was slop.

This action unlinks those issues from closed, unmerged pull requests that have any of the given `labels`.
It does so by wrapping each closing reference in the pull request's body in a code span, so `fixes #123` becomes ``fixes `#123` ``.

`.github/workflows/slop-issue-unlink.yaml`:

```yaml
jobs:
  slop_issue_unlink:
    permissions:
      pull-requests: write
    runs-on: ubuntu-latest
    steps:
      - uses: JoshuaKGoldberg/slop-issue-unlink-action@v0.2.0

name: Slop Issue Unlink

on:
  pull_request_target:
    types:
      - closed
      - labeled
```

Running on `labeled` as well as `closed` catches pull requests that are labeled as slop after they're closed.

By default, `labels` covers the labels applied by [AgentScan](https://github.com/MatteoGabriele/agentscan-action) and the `suspected ai slop` label commonly used with [anti-slop](https://github.com/peakoss/anti-slop):

| Label                         | Applied by                                                               |
| ----------------------------- | ------------------------------------------------------------------------ |
| `agentscan:automated-account` | AgentScan's default `label-automation`                                   |
| `agentscan:community-flagged` | AgentScan's default `label-community-flagged`                            |
| `agentscan:mixed-signals`     | AgentScan's default `label-mixed`                                        |
| `suspected ai slop`           | anti-slop, if configured with `failure-add-pr-labels: suspected ai slop` |

anti-slop doesn't add a label by default, so set its `failure-add-pr-labels` to one of these, or pass your own `labels`:

```yaml
- uses: JoshuaKGoldberg/slop-issue-unlink-action@v0.2.0
  with:
    labels: |
      spam
      my custom slop label
```

This workflow runs with write permissions on pull requests from forks, so consider pinning the action to a full commit SHA rather than a tag.
The action never checks out or runs code from the pull request.

### Inputs

| Input          | Description                                                | Default               |
| -------------- | ---------------------------------------------------------- | --------------------- |
| `github-token` | GitHub token used to read and edit pull requests.          | `${{ github.token }}` |
| `labels`       | Newline-separated labels that mark a pull request as slop. | _(see above)_         |

### Limitations

GitHub's API has no way to remove a link added manually in a pull request's _Development_ sidebar.
The action logs a warning for any linked issue it couldn't unlink.

## Development

See [`.github/CONTRIBUTING.md`](./.github/CONTRIBUTING.md), then [`.github/DEVELOPMENT.md`](./.github/DEVELOPMENT.md).
Thanks! ⛓️‍💥

## Contributors

<!-- spellchecker: disable -->
<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://www.joshuakgoldberg.com"><img src="https://avatars.githubusercontent.com/u/3335181?v=4?s=100" width="100px;" alt="Josh Ghoulberg 👻"/><br /><sub><b>Josh Ghoulberg 👻</b></sub></a><br /><a href="https://github.com/JoshuaKGoldberg/slop-issue-unlink-action/commits?author=JoshuaKGoldberg" title="Code">💻</a> <a href="#content-JoshuaKGoldberg" title="Content">🖋</a> <a href="https://github.com/JoshuaKGoldberg/slop-issue-unlink-action/commits?author=JoshuaKGoldberg" title="Documentation">📖</a> <a href="#ideas-JoshuaKGoldberg" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-JoshuaKGoldberg" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-JoshuaKGoldberg" title="Maintenance">🚧</a> <a href="#projectManagement-JoshuaKGoldberg" title="Project Management">📆</a> <a href="#tool-JoshuaKGoldberg" title="Tools">🔧</a></td>
    </tr>
  </tbody>
</table>

<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
<!-- spellchecker: enable -->

> 💝 This package was templated with [`create-typescript-app`](https://github.com/JoshuaKGoldberg/create-typescript-app) using the [Bingo framework](https://create.bingo).
