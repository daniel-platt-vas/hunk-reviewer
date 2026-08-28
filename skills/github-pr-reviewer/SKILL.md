---
name: github-pr-reviewer
description: Use when independently reviewing a GitHub pull request, branch, or diff, whether it belongs to the user or someone else.
---

# GitHub PR Review

CLI-only workflow for independently reviewing any GitHub PR. Use `gh`, including `gh api` and `gh api graphql`; do not use MCP routes.

## Required reference

Read [CLI.md](CLI.md) before submitting GitHub feedback. It derives an explicit PR URL or the current branch safely, fetches every feedback channel, maps REST comment IDs to GraphQL review threads, posts review comments, and verifies final state.

## Review

1. Resolve the repository and PR; validate metadata and the remote `headRefOid`.
2. Collect paginated inline comments, review summaries, discussion comments, and GraphQL review threads.
3. Inspect the diff plus complete context only for affected and commented-on files. Skip generated files unless relevant.
4. Map REST root comments (`in_reply_to_id == null`) to GraphQL review threads by matching REST `id` to GraphQL `databaseId`. Assess feedback from every author; filter to a bot only when the user asks.
5. De-duplicate existing valid findings. Report only correctness, security, data-flow, concurrency, test-contract, or architecture issues.

Report findings first. Do not submit a review, reply to comments, resolve threads, fix code, or edit the PR description during this workflow. If actionable findings exist, ask the user whether to submit them to the PR.

## Severity tags

Tag every finding and every submitted comment body with exactly one severity label as a bracketed prefix:

- **[Blocker]** — must resolve before merge: a correctness, security, data-flow, concurrency, or failing-test-contract defect.
- **[Suggestion]** — should fix but does not block: a real improvement to performance, maintainability, or minor architecture.
- **[Nit]** — optional: readability, naming, or consistency; not worth blocking a merge on.

The label is independent of the finding-category filter in the Review step. Prefix each finding in the report and each body posted to the PR with the tag, e.g. `[Blocker] ...`.

## Submitting authorized feedback

Only a permission granted after the findings report authorizes submission. Re-read [CLI.md](CLI.md), refresh the remote head and current line locations immediately before posting, and submit only the findings the user approved.

After submission, re-fetch the PR head, comments, review threads, and checks. Report the remote commit, posted feedback, applicable resolved/unresolved thread counts, and each failed, pending, skipped, and successful check. Do not claim CI or tests pass without fresh evidence.

## Common mistakes

- Guessing a repository, PR, or stale comment/thread ID.
- Treating historical or outdated feedback as current without reading current code.
- Posting a review from the initial request instead of asking permission after reporting findings.
- Posting against a stale head or stale diff location.
- Duplicating valid existing findings.
- Omitting the severity tag from a finding or a submitted comment body.
