# Development Phases / مراحل التطوير

> A phased roadmap. Each phase builds on the previous one. Dates are flexible and
> set per sprint by the supervisor.
> خارطة طريق على مراحل. كل مرحلة تبني على التي قبلها. المواعيد مرنة ويحدّدها المشرف لكل Sprint.

---

## Phase 0 — Foundation & Docs / الأساس والتوثيق  ✅ (current)

- Base Next.js project set up.
- Project documentation & phases (this doc set).
- Git workflow and task template defined.

**الأساس والتوثيق (الحالية):** إعداد مشروع Next.js، كتابة التوثيق والمراحل، وتحديد
سير عمل Git وقالب المهام.

---

## Phase 1 — Front-end Foundation / أساس الواجهة الأمامية

- Clean project structure (components, layouts, sections, ui, lib).
- Landing / Home page (hero, features, footer) — **Task 01**.
- Shared UI: buttons, container, navbar, footer.
- Responsive design + dark mode.

**أساس الواجهة الأمامية:** هيكلة نظيفة للمشروع، صفحة Landing/Home، مكوّنات واجهة
مشتركة (أزرار، حاوية، شريط تنقّل، تذييل)، تصميم متجاوب مع وضع ليلي.

---

## Phase 2 — Authentication / المصادقة

- Sign up / Sign in pages.
- Form validation and error states.
- Session handling and protected routes.

**المصادقة:** صفحات تسجيل الدخول والاشتراك، التحقق من النماذج، إدارة الجلسة وحماية المسارات.

---

## Phase 3 — Mentor Chat UI / واجهة محادثة المرشد

- Chat layout (messages list, input, streaming responses).
- Message states (loading, error, retry).
- Conversation history sidebar.

**واجهة محادثة المرشد:** تخطيط المحادثة، حالات الرسائل، وسجل المحادثات.

---

## Phase 4 — Back-end & APIs / الخلفية والـ APIs

- API routes for auth, chat, plans, and progress.
- Database schema (users, plans, conversations, progress).
- Connect front-end to real endpoints.

**الخلفية والـ APIs:** مسارات API، تصميم قاعدة البيانات، وربط الواجهة بالنقاط الحقيقية.

---

## Phase 5 — AI Integration / تكامل الذكاء الاصطناعي

- Connect chat to an AI model.
- Prompting strategy for the "mentor" persona.
- Generate learning plans and recommendations.

**تكامل الذكاء الاصطناعي:** ربط المحادثة بنموذج ذكاء اصطناعي، صياغة شخصية "المرشد"،
وتوليد خطط التعلّم والتوصيات.

---

## Phase 6 — Learning Plans & Progress / الخطط والتقدّم

- Personalized roadmap view.
- Topic tracking and progress indicators.
- Next-step recommendations.

**الخطط والتقدّم:** عرض خارطة الطريق الشخصية، تتبّع المواضيع، ومؤشرات التقدّم.

---

## Phase 7 — Polish & Deployment / التحسين والنشر

- Accessibility (a11y) and performance passes.
- Testing and bug fixing.
- Deployment (e.g. Vercel) and environment configuration.

**التحسين والنشر:** إمكانية الوصول والأداء، الاختبار وإصلاح الأخطاء، والنشر وضبط البيئات.

---

### Definition of Done (per phase) / تعريف الإنجاز لكل مرحلة

- [ ] Feature works on desktop and mobile / تعمل الميزة على سطح المكتب والجوال
- [ ] `pnpm lint` and `pnpm build` pass / تمرّ أوامر الفحص والبناء
- [ ] Code reviewed via Pull Request / تمّت مراجعة الكود عبر Pull Request
- [ ] Merged into `main` / تم الدمج في الفرع الرئيسي
