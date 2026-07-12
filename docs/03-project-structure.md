# Project Structure & Conventions / هيكل المشروع والاصطلاحات

---

## 1. Current structure / الهيكل الحالي

```
AI-Mentor/
├─ docs/                     # Project documentation / توثيق المشروع
│  └─ tasks/                 # Trainee tasks / مهام المتدربين
├─ public/                   # Static assets / الملفات الثابتة
├─ src/
│  ├─ app/                   # Next.js App Router (routes, layout)
│  │  ├─ layout.tsx          # Root layout / التخطيط الجذري
│  │  ├─ not-found.tsx       # 404 page / صفحة غير موجود
│  │  └─ home/page.tsx       # /home route
│  ├─ components/            # React components / المكوّنات
│  │  └─ pages/              # Page-level components / مكوّنات الصفحات
│  └─ style/
│     └─ globals.css         # Global styles / التنسيقات العامة
├─ package.json
└─ tsconfig.json
```

---

## 2. Recommended structure (target) / الهيكل المقترح (الهدف)

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

مع نمو المشروع، نظّم مجلّد `src` كما بالأعلى: عناصر واجهة قابلة لإعادة الاستخدام في
`ui`، ومكوّنات التخطيط في `layout`، وأقسام الصفحات في `sections`، والأدوات في `lib`.

---

## 3. Naming conventions / اصطلاحات التسمية

| Item | Convention | Example |
| --- | --- | --- |
| Component files | `PascalCase.tsx` | `Button.tsx`, `HeroSection.tsx` |
| Hooks | `useCamelCase.ts` | `useTheme.ts` |
| Utilities | `camelCase.ts` | `formatDate.ts` |
| Folders | `kebab-case` or `lowercase` | `components`, `learning-plans` |
| Types/Interfaces | `PascalCase` | `type UserPlan`, `interface ChatMessage` |

---

## 4. Component rules / قواعد المكوّنات

- One component per file; export it as default or a named export consistently.
- Keep components small and focused (single responsibility).
- Put shared, reusable pieces in `components/ui`.
- Use TypeScript props types — **no `any`**.
- Style with Tailwind classes; avoid inline styles.

**قواعد المكوّنات:** مكوّن واحد لكل ملف، مكوّنات صغيرة ومركّزة، العناصر المشتركة في
`components/ui`، تعريف أنواع الـ props بـ TypeScript (**بدون `any`**)، والتنسيق عبر Tailwind.
