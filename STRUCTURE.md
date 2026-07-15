# Project Structure — Feature-Based Architecture

This document defines the folder structure, naming conventions, and placement rules for a modern **Next.js 16** application using **TypeScript**, **Tailwind CSS v4**, **shadcn/ui**, **Redux Toolkit**, and **next-intl**.

---

## Table of Contents

1. [Top-Level Structure](#top-level-structure)
2. [Folder Responsibilities](#folder-responsibilities)
3. [Shared UI Components](#shared-ui-components)
4. [Layout Components](#layout-components)
5. [Feature-Based Modules](#feature-based-modules)
6. [API Layer](#api-layer)
7. [Custom Hooks](#custom-hooks)
8. [Redux Slices](#redux-slices)
9. [TypeScript Types & Interfaces](#typescript-types--interfaces)
10. [Utility Functions](#utility-functions)
11. [Constants & Config](#constants--config)
12. [Validation Schemas (Zod)](#validation-schemas-zod)
13. [Loading, Error & Empty States](#loading-error--empty-states)
14. [Providers](#providers)
15. [Middleware & Route Handlers](#middleware--route-handlers)
16. [Best Practices & Naming Conventions](#best-practices--naming-conventions)
17. [Shared vs Feature — Decision Rules](#shared-vs-feature--decision-rules)
18. [Good vs Bad Examples](#good-vs-bad-examples)

---

## Top-Level Structure

```
src/
├── app/                    # Next.js App Router (routes, layouts, pages)
├── features/               # Feature-based modules (domain logic)
├── shared/                 # Shared UI components, utilities, and types
├── redux/                  # Global Redux store configuration
├── i18n/                   # Internationalization configuration
├── messages/               # Translation source files
├── styles/                 # Global styles and Tailwind layers
└── types/                  # Shared global types
```

---

## Folder Responsibilities

### `src/app/` — App Router

Contains **route pages, root layouts, and API route handlers**. This is the only folder that Next.js treats as a routing tree. It should remain thin — mostly file-based routing with minimal business logic.

```
app/
├── [locale]/               # Locale-based dynamic segment (next-intl)
│   ├── (auth)/             # Route group for auth pages
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (dashboard)/        # Route group for authenticated pages
│   │   ├── dashboard/
│   │   ├── settings/
│   │   └── layout.tsx
│   ├── page.tsx            # Home page
│   └── layout.tsx          # Root layout with providers
├── api/                    # API route handlers (Next.js Route Handlers)
│   ├── auth/
│   └── users/
├── providers.tsx           # Client-side providers wrapper
├── favicon.ico
└── globals.css
```

**Rules:**
- Pages should only import from `features/`, `shared/`, or `redux/`.
- No business logic — pages are composition roots.
- Layouts import providers, headers, footers from `shared/layouts/` or `features/*/components/`.

---

### `src/shared/` — Shared Layer

Reusable UI components, utilities, hooks, and types that have **no feature-specific business logic**.

```
src/
├── app/            # Next.js App Router pages and layouts
├── components/     # Truly shared UI components
├── features/       # Feature modules
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── posts/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   └── shared/     # Cross-feature shared code
├── lib/            # Core utilities
└── types/          # Global types

**Rules:**
- A component belongs in `shared/ui/` if it is **generic, presentational, and feature-agnostic**.
- Components must not import from `features/` or know about feature-specific types.

---

### `src/features/` — Feature Modules

Each domain feature is a self-contained module with its own components, hooks, API calls, store slices, and types.

```
features/
├── auth/
│   ├── components/
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   └── user-profile.tsx
│   ├── hooks/
│   │   ├── use-login.ts
│   │   └── use-auth-status.ts
│   ├── api/
│   │   ├── auth-api.ts
│   │   └── auth-api.types.ts
│   ├── store/
│   │   └── auth-slice.ts
│   ├── validations/
│   │   └── auth-schemas.ts
│   └── types.ts
├── products/
│   ├── components/
│   │   ├── product-card.tsx
│   │   ├── product-list.tsx
│   │   └── product-details.tsx
│   ├── hooks/
│   │   ├── use-products.ts
│   │   └── use-product-detail.ts
│   ├── api/
│   │   └── products-api.ts
│   ├── store/
│   │   └── products-slice.ts
│   ├── validations/
│   │   └── product-schemas.ts
│   └── types.ts
├── dashboard/
│   ├── components/
│   │   ├── dashboard-stats.tsx
│   │   └── recent-activity.tsx
│   ├── hooks/
│   │   └── use-dashboard-data.ts
│   ├── api/
│   │   └── dashboard-api.ts
│   ├── store/
│   │   └── dashboard-slice.ts
│   └── types.ts
├── notifications/
│   ├── components/
│   │   ├── notification-list.tsx
│   │   └── notification-toast.tsx
│   ├── hooks/
│   │   └── use-notifications.ts
│   ├── api/
│   │   └── notifications-api.ts
│   ├── store/
│   │   └── notifications-slice.ts
│   └── types.ts
├── settings/
│   ├── components/
│   │   ├── settings-form.tsx
│   │   └── profile-settings.tsx
│   ├── hooks/
│   │   └── use-settings.ts
│   ├── api/
│   │   └── settings-api.ts
│   ├── store/
│   │   └── settings-slice.ts
│   └── types.ts
└── ...
```

---

### `src/redux/` — Redux Store

```
redux/
├── store.ts                # configureStore with all feature slices
├── root-reducer.ts         # Combined reducer
├── hooks.ts                # Pre-typed useAppSelector, useAppDispatch
└── index.ts
```

---

### `src/i18n/` & `src/messages/` — Internationalization

```
i18n/
├── request.ts              # next-intl request config
└── routing.ts              # Locale routing definitions

messages/
├── en.json
├── ar.json
└── ...
```

---

### `src/styles/` — Global Styles

```
styles/
├── globals.css             # Tailwind directives, CSS variables, base styles
└── animations.css          # Custom keyframes & transitions
```

---

### `src/types/` — Global Types

```
types/
├── api.ts                  # ApiResponse<T>, PaginatedResponse, etc.
├── next.ts                 # Next.js specific type augmentations
└── global.d.ts             # Ambient type declarations
```

---

## Shared UI Components

Every component in `shared/ui/` follows the **shadcn/ui** pattern: one component per folder with a corresponding `.tsx` file and optional sub-components.

| Component   | Path                              |
| ----------- | --------------------------------- |
| Button      | `shared/ui/button/button.tsx`     |
| Input       | `shared/ui/input/input.tsx`       |
| Modal       | `shared/ui/modal/modal.tsx`       |
| Dialog      | `shared/ui/dialog/dialog.tsx`     |
| Dropdown    | `shared/ui/dropdown/dropdown.tsx` |
| Card        | `shared/ui/card/card.tsx`         |
| Avatar      | `shared/ui/avatar/avatar.tsx`     |
| Badge       | `shared/ui/badge/badge.tsx`       |
| Tooltip     | `shared/ui/tooltip/tooltip.tsx`   |
| Logo        | `shared/ui/logo/logo.tsx`         |

**Naming:** PascalCase for component names, kebab-case for folder names.  
**Exports:** Named exports + barrel re-export from `shared/ui/index.ts`.

```tsx
// shared/ui/button/button.tsx
export interface ButtonProps { ... }
export const Button = ({ ... }: ButtonProps) => { ... };
```

```ts
// shared/ui/index.ts
export { Button } from './button/button';
export { Input } from './input/input';
// ...
```

---

## Layout Components

Layouts live in `shared/layouts/` and are used inside `src/app/` layout files.

| Component          | Path                                       |
| ------------------ | ------------------------------------------ |
| Navbar / Header    | `shared/layouts/navbar/navbar.tsx`         |
| Sidebar            | `shared/layouts/sidebar/sidebar.tsx`       |
| Footer             | `shared/layouts/footer/footer.tsx`         |
| MainLayout         | `shared/layouts/main-layout/main-layout.tsx` |
| DashboardLayout    | `shared/layouts/dashboard-layout/dashboard-layout.tsx` |
| AuthLayout         | `shared/layouts/auth-layout/auth-layout.tsx`   |
| Container / Wrapper | `shared/layouts/container/container.tsx`  |
| PageHeader         | `shared/layouts/page-header/page-header.tsx`   |

**Usage in App Router:**

```tsx
// app/[locale]/layout.tsx
import { MainLayout } from '@/shared/layouts';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
```

---

## API Layer

API calls are placed **inside each feature** under `features/<feature>/api/`.

### Rules

- Each feature has its own API module (e.g., `auth-api.ts`).
- Shared/generic API utilities (client instances, interceptors, error handling) go in `shared/lib/api-client.ts`.
- Response types specific to an endpoint live in the API file or a co-located `.types.ts` file.
- Route handlers (Next.js `route.ts`) live in `src/app/api/`.

```
src/
├── shared/lib/
│   └── api-client.ts          # Axios/fetch instance, interceptors
└── features/auth/api/
    ├── auth-api.ts            # login(), register(), logout()
    └── auth-api.types.ts      # LoginRequest, LoginResponse
```

```ts
// features/auth/api/auth-api.ts
import { apiClient } from '@/shared/lib/api-client';
import type { LoginRequest, LoginResponse } from './auth-api.types';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    apiClient.post<RegisterResponse>('/auth/register', data),
};
```

---

## Custom Hooks

### Feature-specific hooks

Placed inside `features/<feature>/hooks/`. Named with a `use` prefix.

```
features/products/hooks/
├── use-products.ts
├── use-product-detail.ts
└── use-product-filter.ts
```

### Shared / generic hooks

Placed inside `shared/hooks/`. These are hooks with **no feature-specific logic**.

```
shared/hooks/
├── use-debounce.ts
├── use-media-query.ts
├── use-local-storage.ts
├── use-click-outside.ts
└── use-intersection-observer.ts
```

---

## Redux Slices

### Feature slices

Each feature manages its own Redux slice inside `features/<feature>/store/`.

```ts
// features/auth/store/auth-slice.ts
import { createSlice } from '@reduxjs/toolkit';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: { ... },
});

export const { ... } = authSlice.actions;
export default authSlice.reducer;
```

### Global store

The store is assembled in `src/redux/store.ts`.

```ts
// redux/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/store/auth-slice';
import productsReducer from '@/features/products/store/products-slice';
// ...

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    // ...
  },
});
```

**Pre-typed hooks** live in `redux/hooks.ts`.

```ts
// redux/hooks.ts
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

---

## TypeScript Types & Interfaces

### Where types live

| Scope        | Location                           |
| ------------ | ---------------------------------- |
| Shared       | `src/types/`                       |
| Per-feature  | `features/<feature>/types.ts`      |
| Per-API      | `features/<feature>/api/*.types.ts` |
| Per-component | Co-located in the component file  |
| Per-slice    | Co-located or `types.ts`           |

### Guidelines

- **Global/shared types** (API envelope responses, pagination shapes) go in `src/types/`.
- **Feature-specific types** (User, Product, Order) go in `features/<feature>/types.ts`.
- **API request/response types** go in `features/<feature>/api/<api>.types.ts`.
- **Component-specific props** are defined and exported directly in the component file.
- **Slice state types** are defined inside the slice file or a co-located `types.ts`.

```ts
// types/api.ts
export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}
```

```ts
// features/products/types.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
  createdAt: string;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price' | 'name' | 'date';
  sortOrder?: 'asc' | 'desc';
}
```

---

## Utility Functions

| Scope        | Location                           |
| ------------ | ---------------------------------- |
| Shared       | `shared/lib/`                      |
| Feature-only | `features/<feature>/lib/`          |

```ts
// shared/lib/
├── cn.ts                    # clsx + tailwind-merge
├── format-date.ts
├── format-currency.ts
├── validation-errors.ts     # Zod error formatter
└── api-client.ts            # HTTP client instance
```

Feature-specific utilities (e.g., a price calculator for the products feature) go inside the feature's own `lib/` folder.

---

## Constants & Config

| Scope        | Location                           |
| ------------ | ---------------------------------- |
| App-wide     | `shared/constants/`                |
| Feature      | `features/<feature>/constants.ts`  |

```ts
// shared/constants/
├── routes.ts                 # Route path constants
├── breakpoints.ts            # Responsive breakpoint values
└── api-endpoints.ts          # API endpoint paths
```

```ts
// features/products/constants.ts
export const PRODUCTS_PER_PAGE = 20;
export const PRODUCT_SORT_OPTIONS = ['price', 'name', 'date'] as const;
```

---

## Validation Schemas (Zod)

### Shared schemas

Schemas for reusable data shapes (e.g., email, phone, ID) go in `shared/validations/`.

### Feature schemas

Feature-specific schemas go in `features/<feature>/validations/`.

```
shared/validations/
├── common.ts                # emailSchema, phoneSchema, idSchema
└── index.ts

features/auth/validations/
├── login-schema.ts
├── register-schema.ts
└── index.ts

features/products/validations/
├── product-schema.ts        # Creation & update schemas
└── index.ts
```

```ts
// shared/validations/common.ts
import { z } from 'zod';

export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
```

```ts
// features/auth/validations/login-schema.ts
import { z } from 'zod';
import { emailSchema, passwordSchema } from '@/shared/validations';

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
```

---

## Loading, Error & Empty States

These state components should be **co-located** with their feature or placed in `shared/ui/` if generic.

| Component                      | Location                                          |
| ------------------------------ | ------------------------------------------------- |
| Generic spinner / skeleton     | `shared/ui/skeleton/skeleton.tsx`                 |
| Generic error boundary         | `shared/ui/error-boundary/error-boundary.tsx`     |
| Generic empty state            | `shared/ui/empty-state/empty-state.tsx`           |
| Loading overlay                | `shared/ui/loading-overlay/loading-overlay.tsx`   |
| Feature-specific empty state   | `features/products/components/product-empty.tsx`  |
| Feature-specific error state   | `features/products/components/product-error.tsx`  |
| Feature-specific loading state | `features/products/components/product-skeleton.tsx` |

```tsx
// Example usage inside a feature component
function ProductList() {
  const { data, isLoading, error } = useProducts();

  if (isLoading) return <ProductSkeleton count={8} />;
  if (error) return <ProductError message={error.message} onRetry={refetch} />;
  if (data.length === 0) return <ProductEmpty />;

  return data.map(product => <ProductCard key={product.id} product={product} />);
}
```

---

## Providers

Providers are placed in `src/app/providers.tsx` and imported in the root layout.

```tsx
// app/providers.tsx
'use client';

import { Provider } from 'react-redux';
import { store } from '@/redux/store';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <Provider store={store}>{children}</Provider>;
}
```

```tsx
// app/[locale]/layout.tsx
import { Providers } from '@/app/providers';
import { MainLayout } from '@/shared/layouts';
import { NextIntlClientProvider } from 'next-intl';

export default async function RootLayout({ children, params }) {
  const messages = await getMessages();

  return (
    <html lang={params.locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <MainLayout>{children}</MainLayout>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**Provider placement order (outer to inner):**
1. `html` / `body`
2. `NextIntlClientProvider` (i18n)
3. Redux `Provider`
4. Theme provider (if any)
5. Layout components

---

## Middleware & Route Handlers

### Middleware

Placed at the project root as `src/middleware.ts`.

```ts
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

### Route Handlers (API routes)

Placed inside `src/app/api/` following Next.js file-based routing.

```
src/app/api/
├── auth/
│   ├── login/route.ts
│   └── register/route.ts
├── products/
│   ├── route.ts              # GET /api/products
│   └── [id]/route.ts         # GET /api/products/:id
└── users/
    └── route.ts
```

Route handlers should delegate business logic to feature-layer functions.

```ts
// app/api/auth/login/route.ts
import { authService } from '@/features/auth/api/auth-service';

export async function POST(req: Request) {
  const body = await req.json();
  const result = await authService.login(body);
  return Response.json(result);
}
```

---

## Best Practices & Naming Conventions

### File & Folder Naming

| Convention              | Example                        |
| ----------------------- | ------------------------------ |
| Component files (PascalCase) | `Button.tsx`, `LoginForm.tsx` |
| Non-component files (kebab-case)  | `api-client.ts`, `auth-slice.ts` |
| Folder names (kebab-case) | `shared/ui/`, `auth/store/`   |
| Interface / Type (PascalCase) | `UserProps`, `ApiResponse` |
| Hooks (camelCase with `use`) | `useProducts`, `useDebounce` |
| Constants (UPPER_SNAKE_CASE) | `PRODUCTS_PER_PAGE` |

### Barrel Exports

Each module level SHOULD have an `index.ts` that re-exports public members.

```ts
// features/auth/index.ts
export { LoginForm } from './components/login-form';
export { RegisterForm } from './components/register-form';
export { useLogin } from './hooks/use-login';
export { authSlice } from './store/auth-slice';
export type { AuthState } from './types';
```

### Import Order

1. `"use client"` / `"use server"` directives
2. React / Next.js imports
3. Third-party library imports
4. Shared layer imports
5. Feature imports
6. Relative imports within module

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/shared/ui';
import { useAppDispatch } from '@/redux/hooks';
import { loginSchema } from './validations/login-schema';
import { useLogin } from '../hooks/use-login';
import type { LoginFormData } from '../types';
```

### Component Responsibility

- **Pages** (`app/`) — route configuration, data fetching for the entry point, minimal JSX.
- **Feature components** (`features/`) — business logic, state management, orchestration.
- **Shared components** (`shared/ui/`) — fully controlled, no side effects, no feature imports, customizable via props/CVA variants.

---

## Shared vs Feature — Decision Rules

Ask these questions to decide where a piece of code belongs:

| Question                                           | Decision                              |
| -------------------------------------------------- | ------------------------------------- |
| Is the component used in 2+ unrelated features?    | → `shared/ui/`                        |
| Does the component know about a specific domain?   | → `features/<feature>/components/`    |
| Can the component be reused with different data?   | → `shared/ui/` (make it data-agnostic) |
| Does the hook manage state for a single domain?    | → `features/<feature>/hooks/`         |
| Can the hook be used in any feature?               | → `shared/hooks/`                     |
| Is the type specific to one API response?          | → co-located in the API file          |
| Is the type used across 2+ features?               | → `src/types/`                         |
| Is the constant tied to a single feature?          | → `features/<feature>/constants.ts`   |
| Is the constant truly app-wide (breakpoints, route paths)? | → `shared/constants/`          |

---

## Good vs Bad Examples

### Good Example

```
features/products/
├── components/
│   ├── product-card.tsx         # Composes shared/ui/card + feature logic
│   ├── product-list.tsx         # Handles loading/error/empty states
│   └── product-details.tsx
├── hooks/
│   ├── use-products.ts          # Fetches + returns normalized data
│   └── use-product-filter.ts
├── api/
│   └── products-api.ts          # All product API calls
├── store/
│   └── products-slice.ts        # Redux slice for product state
├── validations/
│   └── product-schemas.ts       # Zod schemas for product forms
├── constants.ts                 # Feature-specific constants
└── types.ts                     # Product, ProductFilters, etc.
```

```
shared/ui/
├── card/
│   └── card.tsx                 # Generic, no feature knowledge
├── badge/
│   └── badge.tsx
└── index.ts                     # Barrel re-exports
```

### Bad Example — What to Avoid

```
❌ components/
    ├── ProductCard.tsx          # No feature folder, mixed with shared
    ├── Button.tsx
    ├── LoginForm.tsx
    └── ProductAPI.ts            # API logic mixed in components folder

❌ app/
    ├── ProductCard.tsx          # Components should NOT live in app/
    └── utils/
        └── format-date.ts       # Utilities should not be in app/
```

**Common anti-patterns:**

| Anti-pattern                          | Problem                                              |
| ------------------------------------- | ---------------------------------------------------- |
| `src/components/` dumping ground       | No clear distinction between shared and feature code |
| API calls inside component files       | Violates separation of concerns                      |
| Types scattered across `types/`        | No locality — hard to find related types             |
| Redux slices in `redux/slices/`       | Slices are feature-owned, not global                 |
| Business logic inside App Router pages | Pages become unmaintainable                          |
| Shared components importing from features | Creates circular dependencies and coupling        |
