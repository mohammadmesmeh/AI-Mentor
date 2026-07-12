# Task 01: Landing / Home Page + Project Structure

**Phase:** 1 - Front-end Foundation
**Branch:** `feature/landing-home`
**Type:** `feat`

## Goal

Build the public **Landing/Home page** of AI Mentor and lay down a clean,
reusable component structure that later phases will build on.

## Requirements

### A. Project structure
Create these folders under `src/components` and use them:

```
src/components/
├─ ui/          # Reusable primitives (Button, Container)
├─ layout/      # Navbar, Footer
└─ sections/    # Hero, Features, CTA
```

See [03-project-structure.md](../03-project-structure.md).

### B. Shared UI components
- `Button`: variants `primary` and `secondary`; typed props (no `any`).
- `Container`: centered max-width wrapper for page sections.

### C. Layout
- `Navbar`: logo/name plus links (Home, About, Get Started button). Responsive with a mobile menu.
- `Footer`: project name, short line, and a copyright row.

### D. Home page sections
Compose the page from sections in `components/sections`:
1. **Hero**: headline, short description, primary CTA button ("Start Learning").
2. **Features**: 3 to 4 cards describing what the mentor does (plan, answers, progress, feedback).
3. **CTA**: a closing call-to-action band with a button.

### E. Styling and behavior
- Fully **responsive** (mobile to desktop).
- Support **dark mode** using Tailwind `dark:` classes.
- Use Tailwind only, no inline styles.
- Wire the page into the `/home` route (and/or root `/`).

## Acceptance Criteria

- [ ] Folders `ui`, `layout`, `sections` exist and are used
- [ ] `Button` and `Container` are reusable and typed
- [ ] `Navbar` works on mobile (menu toggles) and desktop
- [ ] Home page shows Hero, Features, CTA, and Footer
- [ ] Responsive on mobile and desktop
- [ ] Dark mode looks correct
- [ ] `pnpm lint` passes with no errors
- [ ] `pnpm build` passes
- [ ] Opened as a Pull Request with screenshots

## How to start

```bash
git checkout main
git pull origin main
git checkout -b feature/landing-home
pnpm install
pnpm dev
```

Commit in small steps, for example:

```
feat(ui): add Button and Container components
feat(layout): add responsive Navbar and Footer
feat(home): add Hero, Features and CTA sections
```

Then push and open a Pull Request. See [04-git-workflow.md](../04-git-workflow.md).

## Tips

- Keep components small and focused.
- Reuse `Button` and `Container` everywhere.
- Check the design on a real phone width (about 375px).
- Ask questions early, do not stay blocked.

## Deliverable

A Pull Request from `feature/landing-home` into `main`, with:
- Working Home page and components.
- Screenshots (desktop and mobile) in the PR description.
- Passing lint and build.
