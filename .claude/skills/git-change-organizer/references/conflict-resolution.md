# Conflict resolution: what to auto-resolve vs. what to ask about

Conflicts can show up two places in this workflow: applying a group's diff
into its worktree (`apply_group.sh` reports these as failed paths), and a
PR turning out non-mergeable against its base after other changes landed.
The same judgment applies to both — the question is always "would a
reasonable reviewer wave this through without a second thought, or does
resolving it involve a decision about what the code *should* do?"

## Safe to resolve automatically

These are mechanical — resolving them can't change what the code does in a
way a human needs to weigh in on:

- **Whitespace/formatting-only overlap**: both sides touch the same lines
  but only differ in indentation, trailing whitespace, or line endings.
  Prefer the formatting the base branch already uses.
- **Lockfiles and other generated files** (`package-lock.json`,
  `pnpm-lock.yaml`, `Cargo.lock`, etc.): don't hand-resolve the conflict
  markers — regenerate the file (`npm install`, `pnpm install`, ...) against
  the merged manifest instead, then verify it's consistent.
- **Non-overlapping hunks in the same file that git still flagged**: two
  changes to genuinely different, non-adjacent parts of a file that git's
  default context window merged into one conflict region. Confirm by eye
  that the hunks truly don't interact (no shared variables/logic) before
  resolving.
- **A clean rebase/merge of a group branch onto a newer base where the
  group's own diff is simply reapplied verbatim** (no actual textual
  overlap) — this is just git being conservative, not a real conflict.

Always show the user what was auto-resolved in your summary, even though
you didn't stop to ask — "regenerated package-lock.json after merging" is a
one-line disclosure, not a question.

## Stop and ask

- Both sides modify the **same logic** (a conditional, a function body, a
  return value) — even a seemingly small overlap here encodes a decision
  about which behavior wins, and that's a product call, not a git call.
- A conflict touches auth, payments, migrations, permissions, or CI/infra
  config, regardless of how small the diff looks. Blast radius overrides
  apparent simplicity here.
- Resolving would require deleting or substantially rewriting either side's
  change rather than combining them.
- You're not confident you understand *why* both sides changed the same
  area — don't guess at intent to avoid a question.

When you do ask, show both sides of the conflict concisely (not a raw
conflict-marker dump) and state your best guess at the resolution — the
user can usually just confirm rather than having to reconstruct context
from scratch.
