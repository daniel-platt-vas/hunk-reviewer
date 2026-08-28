#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
command -v bun >/dev/null 2>&1 || { printf 'hunk-reviewer: bun is required\n' >&2; exit 1; }

# Bun registers the package's hunk-reviewer and review-pr bin entries globally.
bun install --global "$repo_root"

skill_dirs=(
  "${HUNK_REVIEWER_CLAUDE_SKILL_DIR:-$HOME/.claude/skills}"
  "${HUNK_REVIEWER_OMP_SKILL_DIR:-$HOME/.omp/agent/skills}"
  "${HUNK_REVIEWER_PI_SKILL_DIR:-$HOME/.pi/agent/skills}"
  "${HUNK_REVIEWER_OPENCODE_SKILL_DIR:-$HOME/.config/opencode/skills}"
  "${HUNK_REVIEWER_COPILOT_SKILL_DIR:-$HOME/.copilot/skills}"
)
for skill_dir in "${skill_dirs[@]}"; do
  mkdir -p "$skill_dir"
  for skill in "$repo_root"/skills/*; do
    [[ -d "$skill" ]] || continue
    ln -sfn "$skill" "$skill_dir/$(basename "$skill")"
  done
  printf 'Installed skills in %s\n' "$skill_dir"
done
