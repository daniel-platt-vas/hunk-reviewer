---
name: reviewing-prs-with-hunk-herdr-omp
description: "Use when starting, refreshing, resuming, or closing a GitHub pull-request review through the personal review-pr tool with Hunk, Herdr, and OMP."
---

# Reviewing PRs with Hunk, Herdr, and OMP

Use the personal command installed at `~/.local/bin/review-pr`; never add it to a project repository.

## Start

Run from the **primary repository checkout** inside a Herdr pane:

```sh
review-pr <pr-number>
```

It creates or reuses `<repo>/.worktrees/pr-<number>-review`, creates a dedicated `PR #<number> review` Herdr workspace, opens Hunk on `origin/<base>...HEAD`, and starts a read-only OMP reviewer.

- Never use `gh pr checkout`, `git switch`, or reset the developer's primary checkout.
- Hunk comments are local review artifacts. Do not post to GitHub unless explicitly requested.
- OMP must review only the PR range; it must not edit, stage, commit, push, or submit feedback.

## Refresh

```sh
review-pr <pr-number> --fresh
```

This only refreshes a clean review worktree. If dirty, preserve it; do not reset, clean, or force-remove it. A force-push or changed PR base invalidates old findings, so re-review the current diff.

## Close

```sh
review-pr --close <pr-number>
```

This closes only the matching Herdr workspace and removes only its clean PR worktree. It refuses dirty worktrees. `--close` discards unpublished Hunk notes and terminal-only OMP findings: capture, export, or intentionally discard them first.

## Failure checks

- Run the command from the primary checkout; the worktree path is rooted there.
- Verify the Hunk session uses the intended `<base>...HEAD` range.
- If cleanup says the worktree is dirty, report the path and state; leave it intact.
- Never close a workspace or delete a worktree whose PR ownership is uncertain.
