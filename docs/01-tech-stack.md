# Tech Stack and Setup

## 1. Tech stack

| Layer | Technology |
| --- | --- |
| Framework | **Next.js 16** (App Router) |
| UI Library | **React 19** |
| Language | **TypeScript 5** |
| Styling | **Tailwind CSS 4** |
| Linting | **ESLint 9** (`eslint-config-next`) |
| Package manager | **pnpm** |

## 2. Prerequisites

- **Node.js** version 20 or higher
- **pnpm** version 9 or higher, install with: `npm install -g pnpm`
- A code editor (VS Code recommended) with ESLint and Tailwind extensions.

## 3. Run the project

```bash
# 1) Install dependencies
pnpm install

# 2) Start the dev server
pnpm dev

# 3) Open in browser
# http://localhost:3000
```

Available scripts:

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Build for production |
| `pnpm start` | Run the production build |
| `pnpm lint` | Run ESLint checks |

## 4. Before you push

Always make sure the project builds and lints cleanly:

```bash
pnpm lint
pnpm build
```
