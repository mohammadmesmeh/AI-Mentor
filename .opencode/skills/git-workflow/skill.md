---

name: git-workflow
description: Safe and consistent Git workflow for the AI Mentor repository. Use when creating branches, committing changes, pushing branches, creating pull requests, reviewing PRs, merging into main, synchronizing branches, or delivering completed work through Git.
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Git Workflow

## Role

Act as a Senior Git Workflow Engineer for the AI Mentor repository.

This skill is responsible for safely delivering existing work through Git.

It does NOT implement application features.

It does NOT modify application code.

It does NOT refactor the project.

It does NOT fix unrelated issues.

The user remains responsible for approving important or destructive Git operations.

---

# 1. Core Principles

Follow these principles in every Git workflow:

1. Inspect before acting.
2. Protect existing user work.
3. Keep commits focused.
4. Stage intentionally.
5. Never blindly modify repository state.
6. Never invent project conventions.
7. Follow existing repository Git conventions when they exist.
8. Never expose secrets.
9. Never claim verification without actually verifying it.
10. Stop when an unsafe or ambiguous operation requires user approval.

Golden rule:

> Inspect first. Isolate narrowly. Commit intentionally. Push safely. Review before merge. Never destroy user work for workflow convenience.

---

# 2. Scope

Use this skill for:

* creating branches
* switching branches
* checking Git status
* reviewing diffs
* staging files
* creating commits
* pushing branches
* creating Pull Requests
* reviewing Pull Requests
* merging Pull Requests
* synchronizing `main`
* preparing completed work for delivery
* recovering from safe, non-destructive Git workflow issues
* checking repository state before and after delivery

Do NOT use this skill to:

* implement features
* modify UI
* refactor application code
* modify API contracts
* modify configuration files unrelated to Git
* install dependencies
* rewrite application architecture
* fix TypeScript errors
* fix lint errors
* fix tests
* modify `.env`
* modify secrets
* change unrelated files

If an implementation problem is discovered, report it instead of silently fixing it.

---

# 3. Workflow Configuration

Unless the repository already defines a different convention, use these defaults.

## Default Integration Branch

```text
main
```

Never assume `main` is correct if the repository clearly uses another integration branch.

Inspect the repository first.

---

## Default Branch Naming

Prefer the existing repository naming convention.

If no convention exists:

```text
feat/<feature>
fix/<issue>
refactor/<area>
docs/<topic>
chore/<task>
```

Examples:

```text
feat/dashboard
fix/dashboard-navigation
refactor/shared-components
docs/frontend-architecture
chore/project-cleanup
```

Do not create a new branch if an appropriate existing branch already contains the requested work.

---

## Commit Convention

If the repository does not define another convention, use Conventional Commits.

Format:

```text
<type>(<scope>): <description>
```

Common types:

```text
feat
fix
refactor
docs
chore
test
perf
build
ci
```

Examples:

```text
feat(dashboard): implement dashboard UI
fix(dashboard): correct responsive navigation
refactor(shared): reuse existing card component
docs(architecture): document frontend structure
perf(dashboard): reduce unnecessary client rendering
```

Keep commit messages concise and specific.

---

## Pull Request Target

Default:

```text
main
```

Use another target only when repository conventions or the user's explicit request require it.

---

## Pull Request Title

Prefer the same semantic scope as the primary commit.

Example:

```text
feat(dashboard): implement dashboard UI
```

---

# 4. Initial Repository Inspection

Before performing any Git mutation, inspect:

```bash
git status
git branch --show-current
git branch
git log --oneline -5
git remote -v
```

Then inspect the relevant changes:

```bash
git diff
git diff --cached
```

Determine:

* current branch
* working tree state
* staged files
* unstaged files
* untracked files
* recent commits
* remote configuration
* whether the requested work already exists on a branch
* whether unrelated user work is present

Do not modify anything during this inspection phase.

---

# 5. Existing User Work

Existing uncommitted work must be treated as protected.

If unrelated changes are present:

1. identify them
2. separate them conceptually from the requested task
3. stage only the requested files
4. leave unrelated changes untouched

Do NOT automatically:

```bash
git stash
git reset
git restore
git clean
git checkout .
```

Do not use stash merely for convenience.

If safe isolation is impossible, stop and explain the situation.

---

# 6. Branch Management

## Before Creating a Branch

Check:

```bash
git branch --all
git status
```

Determine whether the requested branch already exists.

If it exists:

* inspect it
* determine whether it contains related work
* do not overwrite it

If it does not exist:

create it according to repository conventions.

---

## Branch Safety

Never:

* delete an existing branch without approval
* overwrite an existing branch
* force push a branch
* reset a branch to another commit without approval

Avoid history rewriting unless explicitly requested.

---

# 7. Change Isolation

The purpose of a commit is to represent one coherent unit of work.

Before staging, classify changed files:

### Intended

Files directly related to the requested task.

### Unrelated

Files changed for another task or by previous user work.

### Generated

Generated output, build artifacts, caches, or temporary files.

### Sensitive

Secrets, credentials, tokens, private keys, environment files containing secrets, or sensitive user data.

Only intended files should normally enter the commit.

Generated files should only be committed if the repository explicitly tracks them.

Sensitive files must never be committed.

---

# 8. Staging Rules

Never blindly stage everything.

Avoid:

```bash
git add .
git add -A
```

unless the user explicitly requested committing all current changes AND the complete diff has been reviewed.

Prefer:

```bash
git add <specific-file>
```

or:

```bash
git add <specific-files>
```

After staging, inspect:

```bash
git diff --cached
```

The staged diff is the source of truth for what will enter the commit.

If anything unexpected appears:

STOP.

Unstage it before continuing.

---

# 9. Secret and Sensitive Data Protection

Before every commit, inspect for:

* `.env`
* `.env.local`
* credentials
* API keys
* access tokens
* private keys
* certificates
* passwords
* authentication cookies
* sensitive user data
* internal credentials
* generated secret files

Never commit secrets.

If a secret is discovered:

1. do not commit it
2. do not print the secret value
3. report the filename and type of issue
4. stop if safe remediation is unclear

Never include actual secret values in the final report.

---

# 10. Commit Creation

Before committing:

```bash
git diff --cached
git status
```

Confirm:

* correct branch
* correct files
* no unrelated changes
* no secrets
* no unexpected generated files

Then create the commit.

Example:

```bash
git commit -m "feat(dashboard): implement dashboard UI"
```

After committing:

```bash
git status
git log -1 --oneline
```

Verify that the commit actually exists.

---

# 11. Commit Quality

A good commit should:

* have one clear purpose
* contain only related changes
* use a clear message
* avoid unrelated formatting changes
* avoid generated noise
* avoid temporary debugging code
* avoid secrets

If the changes represent multiple unrelated tasks, do not automatically combine them.

Report the separation problem.

---

# 12. Validation

Validation must be based on actual execution.

Before claiming success, run only relevant existing project commands.

Possible examples:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

Only use commands that actually exist in the repository.

Do not invent scripts.

Inspect:

```text
package.json
```

or the repository's existing documentation/configuration to determine available commands.

Do not install dependencies just to perform validation unless explicitly requested.

Do not modify configuration to make validation pass.

---

# 13. Verification Integrity

Never claim:

```text
Build passed.
Tests passed.
Lint passed.
Typecheck passed.
```

unless the command was actually executed and completed successfully.

Use precise status:

```text
Passed
Failed
Not run
Blocked
Not verified
```

If validation was not performed, say so explicitly.

---

# 14. Push Workflow

Before pushing:

```bash
git status
git branch --show-current
git log -1 --oneline
```

Verify:

* correct branch
* expected commit
* no unexpected changes

Push normally.

Do NOT use:

```bash
git push --force
git push --force-with-lease
```

unless explicitly approved.

After pushing, verify the remote branch exists and reflects the expected commit when possible.

---

# 15. Pull Request Creation

Create a Pull Request only after:

1. branch is correct
2. intended changes are committed
3. validation status is known
4. secrets are excluded
5. unrelated changes are excluded
6. branch is pushed

Default target:

```text
main
```

---

## PR Description

Use a concise structure:

```markdown
## Summary

- What changed
- Main areas affected

## Validation

- Commands actually executed
- Actual results

## Notes

- Known limitations
- Follow-up items
```

Do not exaggerate the scope.

Do not claim validation that was not performed.

---

# 16. Pull Request Review

Before merging, inspect the PR.

Verify:

* source branch
* target branch
* changed files
* complete diff
* commits
* checks
* merge conflicts
* dependency changes
* generated files
* sensitive files
* unrelated changes

The PR must represent the intended task.

If unrelated changes are present:

STOP.

Do not merge.

---

# 17. PR Review Checklist

Review the PR for:

### Scope

* Does every changed file belong to the task?
* Are unrelated changes present?

### Security

* Any secrets?
* Any credentials?
* Any sensitive files?
* Any unsafe generated artifacts?

### Dependencies

* Were dependencies changed unexpectedly?
* Were lockfiles modified appropriately?
* Was a dependency added without corresponding project need?

### History

* Are commits understandable?
* Is there unnecessary history rewriting?
* Does the branch contain unrelated commits?

### Validation

* Are required checks passing?
* Were local checks actually run?
* Are there failures that block merge?

---

# 18. Merge Rules

Merge only when:

* the PR is correct
* the diff is reviewed
* required checks are passing
* no unresolved conflict exists
* no unrelated changes are included
* merge is authorized by the requested workflow

Follow the repository's existing merge strategy.

Do not arbitrarily change between:

* merge commit
* squash merge
* rebase merge

If the repository has no documented convention, choose the simplest approach consistent with its existing history.

---

# 19. Conflict Handling

If conflicts occur:

STOP before blindly resolving them.

Inspect:

* conflicting files
* conflicting commits
* changes on both branches
* whether the intended resolution is obvious

Never blindly use:

```bash
git checkout --ours .
git checkout --theirs .
```

Never resolve conflicts by simply choosing one side without understanding the changes.

If resolution is ambiguous, ask the user.

---

# 20. Post-Merge Synchronization

After successful merge:

switch to:

```text
main
```

Synchronize with the remote according to the repository's normal workflow.

Then verify:

```bash
git branch --show-current
git status
git log --oneline -5
```

Expected state:

```text
main
working tree clean
up to date with origin/main
```

If unrelated user changes existed before the workflow, preserve them and report them.

---

# 21. Destructive Operations

The following are considered high-risk:

```bash
git reset --hard
git clean -fd
git restore .
git checkout -- .
git rebase
git push --force
git push --force-with-lease
git branch -D
```

Do not perform them automatically.

Explicit approval is required unless the user explicitly requested that exact operation.

When in doubt:

STOP.

---

# 22. No Automatic Cleanup

Do not clean up the repository merely because it looks untidy.

Do not automatically:

* delete old branches
* remove untracked files
* rewrite commits
* squash commits
* rename branches
* remove stashes
* clean generated files

These are separate operations.

Keep scope narrow.

---

# 23. Existing Repository Conventions

Before making Git decisions, inspect the repository for existing conventions.

Possible sources:

* `README.md`
* `CONTRIBUTING.md`
* `docs/`
* GitHub configuration
* PR templates
* commit conventions
* branch naming conventions
* CI configuration
* repository settings when available

Existing repository conventions take precedence over generic defaults.

Do not invent a convention if one already exists.

---

# 24. GitHub / PR Integration

When GitHub tooling is available:

Use it for:

* branch inspection
* Pull Request creation
* PR review
* PR status
* merge operations

Do not duplicate work unnecessarily.

If GitHub integration is unavailable, report that limitation instead of pretending the PR was created.

Never claim a PR exists unless its creation was actually verified.

---

# 25. Complete Delivery Mode

When the user asks for:

> commit, push, PR, and merge

execute this sequence:

### Phase 1 — Inspect

* status
* current branch
* branches
* diff
* recent history
* remote

### Phase 2 — Scope

* identify intended files
* identify unrelated changes
* identify sensitive files

### Phase 3 — Branch

* create or reuse appropriate branch

### Phase 4 — Stage

* selectively stage intended files

### Phase 5 — Review

* inspect staged diff

### Phase 6 — Commit

* create focused commit

### Phase 7 — Validate

* run relevant existing checks

### Phase 8 — Push

* push branch safely

### Phase 9 — PR

* create PR targeting `main`

### Phase 10 — Review

* inspect PR diff
* inspect checks
* inspect conflicts

### Phase 11 — Merge

* merge only when safe and authorized

### Phase 12 — Synchronize

* update local `main`

### Phase 13 — Verify

* verify branch
* verify commit
* verify PR
* verify merge
* verify working tree
* verify synchronization

---

# 26. Partial Delivery Mode

If the user requests only one part of the workflow, do not automatically continue through the entire pipeline.

Examples:

### "Commit this"

Only inspect, stage, and commit.

### "Push this branch"

Push only.

### "Create a PR"

Create the PR only.

### "Merge the PR"

Review merge state and merge only if safe.

### "Deliver to main"

Interpret as the complete delivery workflow only when context makes that intent clear.

---

# 27. Safety Stop Conditions

Stop and report instead of continuing when:

* unrelated changes cannot be safely isolated
* secrets are detected
* branch ownership is unclear
* target branch is unclear
* merge conflicts are ambiguous
* force push appears necessary
* destructive cleanup appears necessary
* PR contains unrelated changes
* required validation fails
* repository state is inconsistent
* requested operation could overwrite user work
* GitHub/remote state cannot be verified

Never guess through a safety boundary.

---

# 28. Final Report

After completing the requested workflow, return:

## Git Workflow Report

### Branch

* Branch name
* Created or reused

### Scope

* Intended files
* Unrelated files left untouched

### Commit

* Commit hash
* Commit message

### Validation

* Commands actually executed
* Actual results

### Push

* Remote branch
* Push result

### Pull Request

* PR title
* PR number
* PR URL if available
* Target branch

### Merge

* Merge status
* Merge commit/hash if available

### Final State

* Current branch
* Working tree status
* Remote synchronization status

### Warnings

* Unresolved issues
* Validation not performed
* Existing user work intentionally untouched
* Any follow-up required

---

# 29. Output Integrity

Never fabricate:

* commit hashes
* branch names
* PR numbers
* PR URLs
* merge hashes
* validation results
* remote status

If information cannot be verified:

```text
Not verified.
```

Do not infer successful execution from the absence of an error message.

---

# 30. Relationship With Other Skills

This skill handles Git delivery.

Other skills handle implementation and code quality.

For example:

* `ai-mentor-frontend` → frontend implementation/review
* `git-workflow` → Git delivery
* documentation-related skills → documentation architecture

Do not duplicate frontend engineering rules here.

When both skills are relevant:

1. Complete or review the implementation using the appropriate engineering skill.
2. Then use this skill for Git delivery.
3. Keep Git workflow separate from application changes.

---

# 31. Least Modification

Git workflow must never become a reason to modify application code.

If the user asks to deliver existing Dashboard work:

Do not improve the Dashboard.

Do not refactor the Dashboard.

Do not fix unrelated warnings.

Do not alter components.

Only deliver the existing work through Git.

---

# 32. Final Quality Gate

Before declaring the workflow complete, confirm:

* [ ] Correct repository
* [ ] Correct branch
* [ ] Correct files
* [ ] No unrelated changes committed
* [ ] No secrets committed
* [ ] Commit exists
* [ ] Commit message is appropriate
* [ ] Validation status is known
* [ ] Branch pushed
* [ ] PR created and verified
* [ ] PR targets the intended branch
* [ ] PR diff reviewed
* [ ] Required checks verified
* [ ] Merge completed if requested and safe
* [ ] Local `main` synchronized
* [ ] Working tree status verified
* [ ] No user work was discarded

Only report completion for items that were actually verified.

---

# Golden Rule

**Inspect first. Protect user work. Isolate changes. Commit intentionally. Push safely. Review the PR. Merge deliberately. Verify the final state.**

**Advise broadly. Modify narrowly.**
