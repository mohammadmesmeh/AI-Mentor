# PR creation, review, and merging

## Opening PRs

```
git -C <worktree-dir> push -u origin <branch-name>
gh pr create --base <base-ref> --head <branch-name> --title "<title>" --body "<body>"
```

**Title**: match the repo's commit-message convention (check `git log
--format=%s -20`) — e.g. `feat(scope): short description`. If the group has
one commit, the title can mirror it.

**Body**: explain the *why*, drawn from what you learned analyzing the
diffs in step 2 of SKILL.md, not a restatement of the diff itself. A short
template that works well:

```markdown
## What
<one or two sentences on what changed>

## Why
<the reasoning — what problem this solves or what it enables>
```

End PR bodies with whatever attribution convention the current session is
already using for commits/PRs (check standing instructions in context) —
don't hardcode one here since it can vary by session/account.

**If `git push` is rejected** (remote has commits the local branch doesn't):
`git -C <worktree-dir> fetch origin` and `pull --rebase`, or just push again
if the branch is brand new and this was a race. Never `--force` push to
resolve this without the user explicitly telling you the branch is safe to
overwrite — a rejected push on a *brand-new* branch this skill just created
is low-risk to force (nothing else can be pointing at it yet), but always
say so and let a rejection on any branch the user didn't just watch you
create be a stop-and-ask.

**If `gh` isn't configured for this remote** (not a GitHub repo, not
authenticated, etc.): that's not a failure of the branch/commit work. Report
that the branch was pushed and let the user know PR creation wasn't
possible, with the reason.

## Reviewing PRs (only when asked)

- `gh pr checks <number>` — wait for/report CI status. Don't treat pending
  checks as a green light; report them as pending.
- `gh pr diff <number>` and a read of the actual changed files — do a real
  self-review, not a rubber stamp: does the diff match what the PR claims to
  do, does it look complete, anything left half-done or debug-only?
- `gh pr view <number> --json mergeable,mergeStateStatus` — check for
  conflicts before attempting a merge; if conflicted, see
  `references/conflict-resolution.md`.

## Merging

**Default: never merge without the user explicitly asking**, in this
conversation, for this specific merge (or having stated blanket autonomy for
the whole session up front). A clean CI run is a signal that merging is
*safe*, not a signal that it's *wanted* — those are different questions.

When the user has asked for a merge and it's actually safe to do (CI green,
no conflicts, no outstanding review comments the user hasn't addressed):

```
gh pr merge <number> --squash --delete-branch
```

Squash is this skill's default merge method — it keeps the base branch's
history as one clean commit per logical change, matching the whole point of
grouping things this way in the first place. Only deviate (`--merge` for a
merge commit) if the user asks for that instead, or the repo's existing PRs
show a clear house convention of merge commits (check a few recent merged
PRs with `gh pr list --state merged --limit 5` if it's not obvious).

If CI is failing, there are unresolved conflicts, or anything about the PR
looks off during self-review: report what's blocking it and stop — don't
merge partially-passing or unreviewed work even if asked to "merge when
ready," unless the user has made clear they mean "merge automatically once
CI passes, no need to check back with me" for this specific run.
