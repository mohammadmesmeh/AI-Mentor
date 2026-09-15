---
name: git-change-organizer
description: Turns a messy git working tree — a pile of unrelated staged, unstaged, and untracked changes — into clean, logically-grouped commits, one branch per feature/task, pushed and opened as PRs (and merged when explicitly told to). Use this whenever the user wants their git status cleaned up, asks to "organize my changes," "split this into branches/PRs," "commit this properly," says their working tree or git status is "a mess," wants unrelated changes separated before committing, or wants an existing tangle of edits turned into reviewable PRs. Also use it when the user asks to review or merge PRs that resulted from this kind of split. Trigger even if they don't use the words "skill" or name this skill directly — "can you clean up my git status and open PRs for this" or "I've got a ton of uncommitted changes, can you sort them out" both mean this.
---

# Git Change Organizer

Turn an uncommitted, possibly-tangled working tree into clean branches, logical
commits, and clear PRs — without ever losing, deleting, or silently
overwriting a single line the user hasn't explicitly agreed to change.

## Why this needs care

Every other skill in this collection produces files. This one rewrites git
state: it creates branches, commits, pushes to a remote, and can merge PRs.
Those are the highest-consequence actions Claude can take in a repo, so the
design here optimizes for one thing above cleverness: **the user's original
work must be recoverable at every single point**, even if something in the
middle goes wrong, the process is interrupted, or a grouping decision turns
out to be wrong after the fact.

The technique that makes this possible is `git worktree`: instead of
checking out branches in the user's actual working directory (which would
require juggling their uncommitted changes across branch switches — exactly
the kind of operation that loses work when a base commit doesn't have the
same file), every group gets built in an **isolated worktree** off to the
side. The user's real working tree is only ever *read from*, never mutated,
until they've seen the resulting branches/PRs and confirm it's safe to clean
up. If anything goes wrong mid-process, the user's original uncommitted
changes are still sitting right there, untouched.

## Preconditions

Before doing anything, confirm the basics — cheap to check, expensive to
discover mid-way through:

1. `git rev-parse --is-inside-work-tree` — confirm we're in a repo at all.
2. `git status --porcelain=v1` — if this is empty, there's nothing to
   organize; say so and stop.
3. Check for a remote (`git remote -v`) and whether `gh` is installed and
   authenticated (`gh auth status`). If there's no remote or `gh` isn't
   usable, that's fine — do the branching/commit work locally and tell the
   user push/PR steps aren't available rather than failing partway through.
4. Confirm the user actually wants the full pipeline (group → commit →
   push → PR) versus just wanting help committing locally. If their request
   already makes this obvious ("split this into PRs"), don't ask — proceed.

## The workflow

### 1. Snapshot (always first, no exceptions)

Run `scripts/snapshot.sh`. This captures, in one deterministic pass:

- current branch, detected default/base branch, ahead/behind status
- full diff of every tracked change (staged + unstaged, combined)
- the list and content of every untracked file
- `all_changed_paths.txt` — the canonical list of every path with any kind
  of uncommitted change

This snapshot is your safety net and your source of truth for the rest of
the session — note the output directory it prints, you'll pass it to
`check_coverage.sh` later. It's also simply a better way to read the full
picture than issuing a dozen ad-hoc `git diff` calls: read `overview.md` and
`tracked.diff` from the snapshot directory once, up front.

### 2. Understand each change

Read the diffs and untracked file contents from the snapshot. For anything
non-obvious, look at the file's surrounding context (not just the diff hunk)
and recent history (`git log --oneline -20`, `git log -p -- <path>` if a
file's *purpose* isn't clear from the diff alone). You're building an
understanding of **what each change is for**, not just what it touches —
"renamed a prop" and "changed a prop's behavior" look similar in a diff but
belong in very different commits.

### 3. Group into logical units

Cluster the changed paths into groups, where each group is one coherent
feature/task/fix that would make sense as a single PR. Good signals for
"these belong together": they implement one user-facing behavior, one
touches a function the other calls, they were clearly written in the same
sitting for the same reason. Good signals for "these are unrelated": they
touch unconnected areas of the app, one looks like an accidental leftover
edit (e.g. a debug `console.log`, an IDE config change) unrelated to
everything else, or they read like two different sessions of work.

Also check for **dependencies between groups** — if group B's diff only
makes sense with group A's change already applied (e.g. B calls a function
A just introduced), that's a stacking relationship, not two independent
groups. This is exactly the kind of thing to flag to the user (see below)
rather than silently deciding, because stacked branches have merge-order
implications they may not want.

For each proposed group, work out:
- a branch name (short, kebab-case, matching the repo's existing convention
  if `git log --oneline` shows one — e.g. `feat/...`, `fix/...`)
- a base ref: usually the repo's default branch (from
  `overview.md`/`git symbolic-ref`), *not* automatically the current branch.
  If the current branch is itself already a mid-flight feature branch mixing
  several concerns (check its name and `git log` against the default
  branch), each group most likely wants to fork from the default branch so
  it becomes an independent, reviewable PR — don't assume the messy branch
  is the right base just because it's the one checked out.
- one or more commit messages, matching the repo's existing style (check
  `git log --format=%s -20` for a convention like Conventional Commits)

### 4. Ask, or decide — know which

**Proceed without asking** when the right call is evident: an added file and
its obviously-paired test, a self-contained bugfix, formatting/rename-only
diffs, commit wording, branch naming, which of two clearly-fitting groups a
file belongs to.

**Stop and ask the user** when:
- a file's changes plausibly belong to more than one group and it's a real
  judgment call, not just phrasing
- a group's right base branch, or a stacking relationship between groups
  (per above), isn't obvious
- a change touches something with outsized blast radius if grouped wrong —
  auth, payments, migrations, CI/infra config, permissions
- a diff mixes what looks like two unrelated concerns *inside a single
  hunk* (splitting it means rewriting the patch, which is worth a sanity
  check)
- you're about to merge a PR (see `references/pr-and-merge.md` — this is
  always a stop unless the user has explicitly told you, in this
  conversation, to merge on your own judgment)
- a merge conflict isn't one of the straightforward kinds described in
  `references/conflict-resolution.md`

Batch related questions into one round rather than trickling them out. When
you do decide something non-obvious on your own, say so briefly in your
summary ("grouped X with Y because Z") so the user can correct it cheaply
rather than having to reverse-engineer your reasoning.

### 5. Build each group in an isolated worktree

For each group, write its file list to a paths file and its commit message
to a message file, then run:

```
scripts/apply_group.sh --base <base-ref> --branch <branch-name> \
    --paths-file <paths-file> --message-file <message-file>
```

This creates a fresh worktree off `<base-ref>`, pulls in *only* that group's
changes (diffed live from the real working tree — deletions and new files
included), and commits them there. It never touches the user's actual
working directory. If a path fails to apply cleanly (exit code `3`, with the
failing paths listed) — usually because the group's chosen base diverges too
far from that file's current state — don't silently drop the change: either
retry with a different base (e.g. the current branch instead of default), or
surface it to the user. A failed apply is exactly the kind of thing that
must never be quietly swallowed.

### 6. Verify full coverage before doing anything else

Once every group has been applied, run:

```
scripts/check_coverage.sh <snapshot-dir> <worktree-root> <branch1> [branch2 ...]
```

(`<worktree-root>` defaults to `.git/change-organizer/worktrees` unless you
overrode it.) This must report `OK` — every changed path landed on exactly
one branch — before you tell the user the split is done, push anything, or
touch the original working tree. A `MISSING` result means some change hasn't
been committed anywhere yet; go back and make a group for it (asking the
user if it's unclear where it belongs) rather than proceeding. Treat this
check as load-bearing, not a formality — it's the actual proof that nothing
was lost.

### 7. Push and open PRs

For each branch with a clean coverage result:

```
git -C <worktree-dir> push -u origin <branch-name>
gh pr create --base <base-ref> --head <branch-name> --title "..." --body "..."
```

Write the PR body to explain *why*, not just restate the diff — pull that
straight from the understanding you built in step 2. If `gh` isn't
configured for this remote, say so and report that the branch was pushed
(or, if there's no remote either, that it was committed locally) without
treating it as an error. See `references/pr-and-merge.md` for PR body
conventions and how to handle a push that's rejected (never force-push to
resolve this without explicit permission — see that reference).

**Default stopping point: after PRs are opened.** Report what was created
and stop there unless the user has asked you to also review/merge. Don't
merge automatically just because CI is green — that's an explicit ask, every
time, per `references/pr-and-merge.md`.

### 8. Reviewing and merging (only when asked)

When the user does want PRs reviewed and merged, read
`references/pr-and-merge.md` for the full protocol: checking CI status,
self-reviewing the diff, when a conflict is "straightforward" enough to
resolve automatically (`references/conflict-resolution.md`), and the merge
method (squash, matching this skill's default) and confirmation rules.

### 9. Cleanup

Only after the user has confirmed the PRs look right (or immediately, for
branches they've explicitly said to discard/redo): remove the worktrees with
`git worktree remove <dir>` and `git worktree prune`. Leave the user's
original working tree exactly as it was unless they ask you to clear it out
now that everything is safely committed elsewhere — that's their call, not a
default, since it's a free extra safety net for as long as it sits there.

## If something goes wrong mid-process

Nothing in this workflow modifies the user's original working tree, so the
recovery story is simple: the uncommitted changes are still there exactly as
they started. If a worktree or branch ends up in a bad state, it's just a
disposable worktree — remove it and retry that group, or ask the user how
they'd like to proceed. Never resort to `git reset --hard`, `git checkout --
.`, `git clean -f`, or a force-push against anything that might contain the
user's only copy of a change, even to "fix" a mistake this skill made.
