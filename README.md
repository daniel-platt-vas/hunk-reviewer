# hunk-reviewer

Portable Hunk pull-request review tooling for Claude, OMP, Pi, OpenCode, and Copilot.

## Install

Requirements: Bun 1.1+, GitHub CLI, Hunk, Herdr, and the selected coding agent.

```sh
cd ~/projects/hunk-reviewer
./install.sh
```

The installer runs `bun install --global .`, registering one command:

```sh
hunk-review
```

It installs shared skills for Claude, OMP, Pi, OpenCode, and Copilot. Override destinations with `HUNK_REVIEW_<AGENT>_SKILL_DIR`.

## Start and manage reviews

Run from the primary checkout inside a Herdr pane:

```sh
hunk-review start 1704 --agent-kind claude
hunk-review start 1704 --agent-kind omp
hunk-review start 1704 --agent-kind pi
hunk-review start 1704 --agent-kind opencode
hunk-review start 1704 --agent-kind copilot
```

Set the default with `HUNK_REVIEW_AGENT_KIND`. Other operations:

```sh
hunk-review start 1704 --fresh
hunk-review close 1704
```

The start command creates an isolated worktree, opens `origin/<base>...HEAD` in Hunk, and starts the selected reviewer in a sibling Herdr pane.

## Custom review standards

Pass a review skill file, or a directory containing `SKILL.md`:

```sh
hunk-review start 1704 --agent-kind claude --review-skill ~/reviews/dairy-care/SKILL.md
hunk-review start 1704 --review-skill ~/reviews/security-review
```

Or set `HUNK_REVIEW_SKILL`. Custom standards are added to the baseline scope and safety instructions; they cannot authorize edits, pushes, or review outside the PR range.

## Watch Hunk comments

Dispatch each new human-authored Hunk comment as JSON to any command:

```sh
hunk-review watch \
  --repo /path/to/review-worktree \
  --command 'my-reviewer --repo /path/to/review-worktree'
```

The command receives one comment object on stdin. Successful exit marks it handled; failures are retried. Use `--no-baseline`, `--once`, `--interval`, and `--state-file` as needed. Comments are filtered with `--type user` to prevent feedback loops.

## Included skills

- `hunk-review`: Hunk session inspection, navigation, comments, and highlights.
- `receiving-code-review`: responding to review feedback.
- `github-pr-reviewer`: GitHub PR review workflow.
- `code-review`: local diff review guidance.
- `reviewing-prs-with-hunk-herdr-omp`: Herdr workflow guidance for supported agent kinds.
