# Project Structure and Conventions

## 1. Current structure

```
AI-Mentor/
├─ docs/                     # Project documentation
│  └─ tasks/                 # Trainee tasks
├─ public/                   # Static assets
├─ src/
│  ├─ app/                   # Next.js App Router (routes, layout)
│  │  ├─ layout.tsx          # Root layout
│  │  ├─ not-found.tsx       # 404 page
│  │  └─ home/page.tsx       # /home route
│  ├─ components/            # React components
│  │  └─ pages/              # Page-level components
│  └─ style/
│     └─ globals.css         # Global styles
├─ package.json
└─ tsconfig.json
```

## 2. Recommended structure (target)

As the project grows, organize `src` like this:

```
src/
├─ app/                      # Routes only (thin pages)
├─ components/
│  ├─ ui/                    # Reusable primitives (Button, Container, Input)
│  ├─ layout/                # Navbar, Footer, Sidebar
│  ├─ sections/              # Page sections (Hero, Features, CTA)
│  └─ pages/                 # Page compositions
├─ lib/                      # Helpers, API clients, utils
├─ hooks/                    # Custom React hooks
├─ types/                    # Shared TypeScript types
└─ style/                    # Global styles
```

## 3. Naming conventions

| Item | Convention | Example |
| --- | --- | --- |
| Component files | `PascalCase.tsx` | `Button.tsx`, `HeroSection.tsx` |
| Hooks | `useCamelCase.ts` | `useTheme.ts` |
| Utilities | `camelCase.ts` | `formatDate.ts` |
| Folders | `kebab-case` or `lowercase` | `components`, `learning-plans` |
| Types/Interfaces | `PascalCase` | `type UserPlan`, `interface ChatMessage` |

## 4. Component rules

- One component per file; export it as default or a named export consistently.
- Keep components small and focused (single responsibility).
- Put shared, reusable pieces in `components/ui`.
- Use TypeScript props types, no `any`.
- Style with Tailwind classes; avoid inline styles.
