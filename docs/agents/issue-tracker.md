# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues on `KindnessofGod/emmason_onliine_store`. This environment has no `gh` CLI — use the GitHub MCP tools (`mcp__github__*`) for all operations. If a `gh` CLI ever becomes available here, its commands are equivalent and can be used interchangeably.

## Conventions

- **Create an issue**: `mcp__github__issue_write` (method: create) with owner/repo/title/body.
- **Read an issue**: `mcp__github__issue_read`. GitHub shares one number space across issues and PRs — fall back to `mcp__github__pull_request_read` if the number turns out to be a PR.
- **List issues**: `mcp__github__list_issues`, filtered by state/labels. Use `mcp__github__search_issues` for text or label queries.
- **Comment on an issue**: `mcp__github__add_issue_comment`.
- **Apply / remove labels**: `mcp__github__issue_write` (method: update) with the labels field. Confirm a label exists first with `mcp__github__get_label` or `mcp__github__list_issue_fields`.
- **Close**: `mcp__github__issue_write` (method: update) with state closed, plus a closing comment via `add_issue_comment`.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

## When a skill says "publish to the issue tracker"

Create a GitHub issue via `mcp__github__issue_write`.

## When a skill says "fetch the relevant ticket"

Read it via `mcp__github__issue_read`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, created via `mcp__github__issue_write`.
- **Child ticket**: create via `mcp__github__sub_issue_write`, linking it to the map as a native GitHub sub-issue. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, assign it to the driving session.
- **Blocking**: no MCP tool in this environment exposes GitHub's native issue-dependencies endpoint. Fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker issue is closed.
- **Frontier query**: list the map's open sub-issues (`mcp__github__list_issues`, scoped to the map), drop any with an open `Blocked by` reference or an assignee; first in map order wins.
- **Claim**: update the issue's assignee via `mcp__github__issue_write`.
- **Resolve**: comment the answer via `mcp__github__add_issue_comment`, close via `mcp__github__issue_write`, then append a context pointer to the map's Decisions-so-far.
