# Tech Stack & Setup / التقنيات والإعداد

---

## 1. Tech stack / التقنيات

| Layer | Technology |
| --- | --- |
| Framework | **Next.js 16** (App Router) |
| UI Library | **React 19** |
| Language | **TypeScript 5** |
| Styling | **Tailwind CSS 4** |
| Linting | **ESLint 9** (`eslint-config-next`) |
| Package manager | **pnpm** |

نستخدم **Next.js 16** مع **React 19** و**TypeScript** و**Tailwind CSS 4**،
وإدارة الحزم عبر **pnpm**، والتحقق من الكود عبر **ESLint**.

---

## 2. Prerequisites / المتطلبات المسبقة

- **Node.js** ≥ 20
- **pnpm** ≥ 9 → install with: `npm install -g pnpm`
- A code editor (VS Code recommended) with ESLint & Tailwind extensions.

---

## 3. Run the project / تشغيل المشروع

```bash
# 1) Install dependencies / تثبيت الاعتماديات
pnpm install

# 2) Start the dev server / تشغيل خادم التطوير
pnpm dev

# 3) Open in browser / افتح في المتصفح
# http://localhost:3000
```

Available scripts / الأوامر المتاحة:

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server / تشغيل بيئة التطوير |
| `pnpm build` | Build for production / بناء نسخة الإنتاج |
| `pnpm start` | Run the production build / تشغيل نسخة الإنتاج |
| `pnpm lint` | Run ESLint checks / فحص الكود بـ ESLint |

---

## 4. Before you push / قبل رفع الكود

Always make sure the project builds and lints cleanly:

```bash
pnpm lint
pnpm build
```

تأكّد دائماً أن المشروع يمرّ بـ `pnpm lint` و`pnpm build` بدون أخطاء قبل رفع الكود.
