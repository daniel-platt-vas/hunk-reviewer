---
name: receiving-code-review
description: Use when evaluating or responding to review feedback on work the user owns, including GitHub comments, review threads, pasted feedback, Slack, or email.
---

# Receiving Code Review

Evaluate feedback against the codebase before accepting, rejecting, replying, or changing code. Reviewer confidence is not evidence.

## Intake and evaluation

1. Read every item before acting. Group related comments.
2. Restate an unclear item and request clarification. Do not implement a subset while any item remains unclear.
3. Verify each clear item against current code, tests, product requirements, compatibility constraints, and prior user decisions.
4. Classify every item:

| Classification | Action |
| --- | --- |
| Valid | Explain the defect and fix or respond when authorized. |
| Invalid | State concise, code-specific pushback. |
| Unclear | Ask the reviewer or user for the missing requirement. |
| Needs decision | State the trade-off and wait for the user. |
Every item MUST receive exactly one of these classifications. If correctness cannot yet be verified from available code or requirements, classify it as Unclear; do not invent an additional status.

Do not use performative agreement. A technically wrong or unnecessary suggestion gets evidence-backed pushback. Feedback that conflicts with the user's stated design requires a user decision.

## Acting on feedback

Handle confirmed items in this order: security or correctness, small mechanical corrections, then larger changes. Verify each accepted change with the narrowest relevant check.

For feedback outside GitHub, draft the response; do not send messages to external systems.

For GitHub review feedback, read [the shared CLI procedure](../github-pr-reviewer/CLI.md) before any mutation. It is the source of truth for PR resolution, current comment/thread collection, replies, resolutions, description edits, branch safety, and post-mutation verification.

A request to fix, reply, resolve, or edit authorizes only that mutation. Before replying or resolving, re-fetch the current thread and code. Resolve only after verifying a fix or obsolescence; decision-blocked and unverified threads remain unresolved.

## Response shape

Report each item with its classification, evidence, action taken or required decision, and verification. For GitHub mutations, include the refreshed PR head, replies posted, applicable resolved/unresolved thread counts, and check state from the shared procedure.
