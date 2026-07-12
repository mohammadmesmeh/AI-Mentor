# Task 01 — Landing / Home Page + Project Structure

**Phase:** 1 — Front-end Foundation
**Branch:** `feature/landing-home`
**Type:** `feat`

> المرحلة: 1 — أساس الواجهة الأمامية · الفرع: `feature/landing-home` · النوع: `feat`

---

## 🎯 Goal / الهدف

Build the public **Landing/Home page** of AI Mentor and lay down a clean,
reusable component structure that later phases will build on.

بناء **صفحة Landing/Home** العامة لـ AI Mentor، مع إرساء هيكل مكوّنات نظيف وقابل
لإعادة الاستخدام تبني عليه المراحل القادمة.

---

## 📋 Requirements / المتطلبات

### A. Project structure / هيكلة المشروع
Create these folders under `src/components` and use them:

```
src/components/
├─ ui/          # Reusable primitives (Button, Container)
├─ layout/      # Navbar, Footer
└─ sections/    # Hero, Features, CTA
```

أنشئ المجلّدات أعلاه واستخدمها. راجع [03-project-structure.md](../03-project-structure.md).

### B. Shared UI components / مكوّنات واجهة مشتركة
- `Button` — variants: `primary`, `secondary`; typed props (no `any`).
- `Container` — centered max-width wrapper for page sections.

### C. Layout / التخطيط
- `Navbar` — logo/name + links (Home, About, Get Started button). Responsive with a mobile menu.
- `Footer` — project name, short line, and a copyright row.

### D. Home page sections / أقسام الصفحة
Compose the page from sections in `components/sections`:
1. **Hero** — headline, short description, primary CTA button ("Start Learning").
2. **Features** — 3–4 cards describing what the mentor does (plan, answers, progress, feedback).
3. **CTA** — a closing call-to-action band with a button.

اجمع الصفحة من أقسام داخل `components/sections`: قسم رئيسي (Hero)، قسم مميزات
(3–4 بطاقات)، وقسم دعوة لاتخاذ إجراء (CTA).

### E. Styling & behavior / التنسيق والسلوك
- Fully **responsive** (mobile → desktop).
- Support **dark mode** using Tailwind `dark:` classes.
- Use Tailwind only — no inline styles.
- Wire the page into the `/home` route (and/or root `/`).

---

## ✅ Acceptance Criteria / معايير القبول

- [ ] Folders `ui`, `layout`, `sections` exist and are used
- [ ] `Button` and `Container` are reusable and typed
- [ ] `Navbar` works on mobile (menu toggles) and desktop
- [ ] Home page shows Hero + Features + CTA + Footer
- [ ] Responsive on mobile and desktop
- [ ] Dark mode looks correct
- [ ] `pnpm lint` passes with no errors
- [ ] `pnpm build` passes
- [ ] Opened as a Pull Request with screenshots

معايير القبول أعلاه — لا يُدمج التاسك إلا بعد تحقّقها جميعاً عبر Pull Request.

---

## 🚀 How to start / كيف تبدأ

```bash
git checkout main
git pull origin main
git checkout -b feature/landing-home
pnpm install
pnpm dev
```

Commit in small steps, e.g.:

```
feat(ui): add Button and Container components
feat(layout): add responsive Navbar and Footer
feat(home): add Hero, Features and CTA sections
```

Then push and open a Pull Request. See [04-git-workflow.md](../04-git-workflow.md).

اعمل بـ commits صغيرة، ثم ارفع الفرع وافتح Pull Request حسب دليل سير عمل Git.

---

## 💡 Tips / نصائح

- Keep components small and focused. / اجعل المكوّنات صغيرة ومركّزة.
- Reuse `Button` and `Container` everywhere. / أعد استخدام `Button` و`Container`.
- Check the design on a real phone width (~375px). / اختبر على عرض جوال حقيقي.
- Ask questions early — don't stay blocked. / اسأل مبكراً ولا تبقَ عالقاً.

---

## 📦 Deliverable / التسليم

A Pull Request from `feature/landing-home` → `main`, with:
- Working Home page and components.
- Screenshots (desktop + mobile) in the PR description.
- Passing lint and build.

Pull Request من `feature/landing-home` إلى `main` يتضمّن صفحة عاملة وصوراً
(سطح مكتب + جوال) ونجاح الفحص والبناء.
