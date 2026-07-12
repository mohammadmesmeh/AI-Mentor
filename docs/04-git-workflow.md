# Git Workflow and Commit Rules

> This is how the whole team collaborates. Please follow it for every task.

## 1. Branching model

- `main`: stable, always working. **No direct commits.**
- `docs`: documentation updates.
- `feature/<name>`: a new feature or task.
- `fix/<name>`: a bug fix.

Examples:

```
feature/landing-home
feature/auth-pages
fix/navbar-mobile-menu
```

## 2. Standard workflow

```bash
# 1) Update main
git checkout main
git pull origin main

# 2) Create a task branch
git checkout -b feature/landing-home

# 3) Work and commit in small steps
git add .
git commit -m "feat(home): add hero section"

# 4) Push the branch
git push -u origin feature/landing-home

# 5) Open a Pull Request on GitHub and request review
```

## 3. Commit message convention

We use **Conventional Commits**: `type(scope): short description`

| Type | When to use |
| --- | --- |
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code change, no feature/fix |
| `chore` | Config, deps, tooling |

Good examples:

```
feat(home): add responsive hero section
fix(navbar): close mobile menu on link click
docs(readme): add setup instructions
refactor(ui): extract Button component
```

Rules:
- Write in the **imperative** ("add", not "added").
- Keep the summary under about 60 characters.
- One logical change per commit, avoid huge commits.

## 4. Pull Request checklist

Before requesting review:

- [ ] Branch is up to date with `main`
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes
- [ ] PR title follows commit convention
- [ ] Description explains **what** and **why**
- [ ] Screenshots for UI changes

## 5. Golden rules

1. Never push directly to `main`.
2. Pull before you start.
3. Small, frequent commits.
4. Never commit secrets or `.env` files.
5. Ask for review, do not self-merge without approval.
