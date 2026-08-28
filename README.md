# hunk-reviewer

Portable tooling and skills for reviewing GitHub pull requests in Hunk with Claude, OMP, Pi, OpenCode, or Copilot.

## Install

Requirements: Bun 1.1+, GitHub CLI, Hunk, Herdr, and the agent you intend to use.

```sh
cd ~/projects/hunk-reviewer
./install.sh
```

The installer runs `bun install --global .`, which registers both commands from `package.json`:

```sh
hunk-reviewer
review-pr
```

It also symlinks shared skills into all supported agent locations:

- Claude: `~/.claude/skills`
- OMP: `~/.omp/agent/skills`
- Pi: `~/.pi/agent/skills`
- OpenCode: `~/.config/opencode/skills`
- Copilot: `~/.copilot/skills`

Override any skill destination with `HUNK_REVIEWER_<AGENT>_SKILL_DIR`.

To update after pulling changes:

```sh
cd ~/projects/hunk-reviewer
./install.sh
```

Run from the primary checkout inside a Herdr pane:

```sh
review-pr 1704 --agent-kind claude
review-pr 1704 --agent-kind omp
review-pr 1704 --agent-kind pi
review-pr 1704 --agent-kind opencode
review-pr 1704 --agent-kind copilot
```

`--kind` is an alias. Set a default with:

```sh
export HUNK_REVIEW_AGENT_KIND=claude
```

The launcher creates an isolated review worktree, opens `origin/<base>...HEAD` in Hunk, and starts the selected reviewer in a sibling Herdr pane. Supported kinds are `claude`, `omp`, `pi`, `opencode`, and `copilot`.

Other operations:

```sh
review-pr 1704 --fresh
review-pr --close 1704
```

Hunk comments remain local review artifacts unless separately exported or posted.

## Custom review standards

Pass a review skill file, or a directory containing `SKILL.md`:

```sh
review-pr 1704 --agent-kind claude --review-skill ~/reviews/dairy-care/SKILL.md
review-pr 1704 --review-skill ~/reviews/security-review
```

You can set a default with `HUNK_REVIEW_SKILL`. Custom standards are added to the launcher's baseline scope and safety instructions; they do not permit editing, pushing, or reviewing outside the PR range.

## Watch Hunk comments

Dispatch each new human-authored Hunk comment as JSON to any command:

```sh
hunk-reviewer \
  --repo /path/to/review-worktree \
  --command 'my-reviewer --repo /path/to/review-worktree'
```

The command receives one comment object on stdin. Successful exit marks it handled; failures are retried. Existing comments are initially treated as a baseline. Use `--no-baseline`, `--once`, `--interval`, and `--state-file` as needed. Filtering with `--type user` prevents agent-comment feedback loops.

## Included skills

- `hunk-review`: Hunk session inspection, navigation, comments, and highlights.
- `receiving-code-review`: responding to review feedback.
- `github-pr-reviewer`: GitHub PR review workflow.
- `code-review`: local diff review guidance.
- `reviewing-prs-with-hunk-herdr-omp`: Herdr workflow guidance; despite its historical name, the launcher now supports all five agent kinds.
