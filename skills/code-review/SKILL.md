---
name: code-review
description: Use when reviewing a local diff against standards and requirements, or requesting an independent pre-merge review of completed work.
---

# Code Review

Choose one mode. External GitHub PR review belongs to `github-pr-reviewer`; feedback received on the user’s own work belongs to `receiving-code-review`.

## Select a mode

| Situation | Mode |
| --- | --- |
| The user wants an assessment of a branch, diff, or work in progress. | **Self-review** |
| A task or feature is complete and needs a fresh review gate before continuing or merging. | **Independent review** |

Both modes review a fixed commit range. Resolve the fixed point first and use `git diff <base>...HEAD`; reject an invalid or empty range before reviewing.

## Self-review

Review the range on two independent axes.

### Standards

Read repository standards. Then inspect for documented violations and these judgement-call smells, unless repository guidance explicitly permits them: mysterious names, duplicated code, feature envy, data clumps, primitive obsession, repeated switches, shotgun surgery, divergent change, speculative generality, message chains, middle men, and refused bequest.

### Requirements

Find the originating requirements in this order: issue references in commits, a user-supplied path, then a matching document under `docs/`, `specs/`, or `.scratch/`. If no source exists, report that requirements coverage is unavailable.

Report separately:

- **Standards:** documented violations and labelled judgement-call smells, with file/hunk evidence.
- **Requirements:** missing, partial, incorrect, or out-of-scope behavior, citing the requirement.

Do not merge, rerank, or hide findings across the two axes.

## Independent review

Use a fresh reviewer context that receives only:

- what changed and why;
- the fixed-point and head SHAs;
- the exact diff command;
- the relevant requirements or plan;
- applicable repository standards;
- the requested review focus.

The reviewer reports findings by severity with file and line evidence. Fix blocking and important findings before merge; verify or push back on incorrect findings with code and test evidence. If the reviewer finds no blocking issue, report the review boundary and result.

## Review output

State the reviewed range, requirements source or its absence, findings by axis or severity, and the highest-risk remaining issue. This skill does not post GitHub comments or mutate a PR.