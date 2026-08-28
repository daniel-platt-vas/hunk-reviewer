# CLI Reference

Use `gh`; do not use MCP routes.

## Resolve repository and PR

**Explicit URL:**

```bash
PR_URL='https://github.com/OWNER/REPO/pull/NUMBER'
REPO=$(gh pr view "$PR_URL" --json url --jq '.url | capture("github\\.com/(?<repo>[^/]+/[^/]+)/pull/").repo')
PR=$(gh pr view "$PR_URL" --json number --jq '.number')
```

**Current branch:**

```bash
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
BRANCH=$(git branch --show-current)
test -n "$BRANCH" || { echo 'Detached HEAD: provide a PR URL or number'; exit 1; }
CANDIDATES=$(gh pr list --repo "$REPO" --head "$BRANCH" --state open --json number,headRepository,isCrossRepository)
COUNT=$(printf '%s' "$CANDIDATES" | jq --arg repo "$REPO" '[.[] | select(.isCrossRepository == false and .headRepository.nameWithOwner == $repo)] | length')
test "$COUNT" = 1 || { echo "Expected one same-repository open PR for $BRANCH; found $COUNT"; exit 1; }
PR=$(printf '%s' "$CANDIDATES" | jq -r --arg repo "$REPO" '[.[] | select(.isCrossRepository == false and .headRepository.nameWithOwner == $repo)][0].number')
```

Fetch the source of truth:

```bash
gh pr view "$PR" --repo "$REPO" --json number,title,body,author,baseRefName,headRefName,headRefOid,files,additions,deletions,url

```
An explicit URL may target a fork PR: review, reply, resolution, and description mutations apply to that explicit target when authorized. Never edit or push its head branch unless the same-repository and branch-safety preflights below pass.

For the checked-out branch, record the initial `headRefOid` as `REMOTE_HEAD` before any mutation. Before `git push`, run `HEAD_BRANCH=$(gh pr view "$PR" --repo "$REPO" --json headRefName --jq '.headRefName')`, require `test "$BRANCH" = "$HEAD_BRANCH"`, and require `test "$(gh pr view "$PR" --repo "$REPO" --json isCrossRepository --jq '.isCrossRepository')" = false`. Re-fetch `headRefOid` and require it still equals `$REMOTE_HEAD`; otherwise stop and reassess the newer PR. Do not push a branch whose protection state is unknown, external, or protected without explicit user authorization.

Check classic branch protection before pushing:

```bash
PROTECTION_STATUS=$(gh api --include "repos/$REPO/branches/$HEAD_BRANCH/protection" 2>&1 | sed -n '1s/HTTP\/[^ ]* \([0-9][0-9][0-9]\).*/\1/p')
case "$PROTECTION_STATUS" in
  404) ;;
  200) echo "Protected branch: do not push"; exit 1 ;;
  *) echo "Branch protection unavailable: do not push"; exit 1 ;;
esac
```

Treat repository rulesets as deny-by-default because applicability is branch-pattern dependent:

```bash
RULESET_COUNT=$(gh api "repos/$REPO/rulesets" --jq 'length') || { echo "Rulesets unavailable: do not push"; exit 1; }
test "$RULESET_COUNT" = 0 || { echo "Repository has rulesets: do not push without explicit user authorization"; exit 1; }
```

## Gather all feedback

```bash
gh api --paginate "repos/$REPO/pulls/$PR/comments"
gh api --paginate "repos/$REPO/pulls/$PR/reviews"
gh api --paginate "repos/$REPO/issues/$PR/comments"
```

```bash
OWNER=${REPO%%/*}; NAME=${REPO#*/}
THREADS_QUERY='
query($owner: String!, $name: String!, $number: Int!, $endCursor: String) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      reviewThreads(first: 100, after: $endCursor) {
        nodes {
          id isResolved isOutdated
          comments(first: 100) { nodes { databaseId body author { login } path line startLine commit { oid } } }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}'
gh api graphql --paginate -F owner="$OWNER" -F name="$NAME" -F number="$PR" -f query="$THREADS_QUERY"
```

If a thread returns 100 comments, paginate that thread before classifying it:

```bash
THREAD_COMMENTS_QUERY='
query($threadId: ID!, $endCursor: String) {
  node(id: $threadId) {
    ... on PullRequestReviewThread {
      comments(first: 100, after: $endCursor) {
        nodes { databaseId body author { login } path line startLine commit { oid } }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}'
gh api graphql --paginate -F threadId="$THREAD_ID" -f query="$THREAD_COMMENTS_QUERY"
```

Inspect the diff and full context only for changed files and comment targets. Do not expand generated files unless they are relevant.

## Mutate after authorization

Use fresh root comment IDs immediately before replying:

```bash
gh api --method POST "repos/$REPO/pulls/$PR/comments/$COMMENT_ID/replies" --field body="$REPLY"
# Re-fetch reviewThreads and map the fresh thread ID before resolving.
gh api graphql -F threadId="$THREAD_ID" -f query='mutation($threadId:ID!){resolveReviewThread(input:{threadId:$threadId}){thread{id isResolved}}}'
# Re-fetch reviewThreads again to confirm `isResolved`.
```

For an inline review, use the freshly fetched `headRefOid` and current line/side positions:

```bash
gh api --method POST "repos/$REPO/pulls/$PR/reviews" \
  -f commit_id="$HEAD_SHA" -f event=COMMENT -f body="$SUMMARY" \
  -f 'comments[][path]'="$PATH" -f 'comments[][line]'="$LINE" \
  -f 'comments[][side]'=RIGHT -f 'comments[][body]'="$COMMENT"
```

For a description:

```bash
gh pr edit "$PR" --repo "$REPO" --body-file PR_DESCRIPTION.md
gh pr view "$PR" --repo "$REPO" --json body --jq '.body' > PR_DESCRIPTION.actual.md
diff -u PR_DESCRIPTION.md PR_DESCRIPTION.actual.md
```

## Verify

```bash
gh pr view "$PR" --repo "$REPO" --json headRefOid,body
gh pr checks "$PR" --repo "$REPO" --json name,state,bucket
gh pr checks "$PR" --repo "$REPO" --required --json name,state,bucket
```

Report failed, pending, skipped, neutral, cancelled, timed-out, action-required, and successful checks distinctly. A PR is healthy only when every `--required` check succeeds; skipped or neutral checks do not establish health, and no required checks means health is unknown. Re-fetch review threads; count applicable resolved and unresolved threads rather than treating all historical comments as active.
