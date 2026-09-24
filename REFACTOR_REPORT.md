# Refactor Report — AI Mentor (frontend)

Branch: `refactor/code-quality-review` (based on `main` @ `c28e030`) · دفعتان: 7 commits في الأولى + 9 في الثانية، إضافة إلى commit للتقرير بعد كل دفعة · **not pushed**

> الأقسام من "Executive Summary" حتى "Recommendations" توثّق **الدفعة الأولى**، مع تحديث حالة البنود التي حسمتها الدفعة الثانية في مكانها. تفاصيل الدفعة الثانية كاملة في القسم الأخير: [Batch 2 — Follow-up Decisions](#batch-2--follow-up-decisions).

## Executive Summary

تمت مراجعة هندسية كاملة للـfrontend وتطبيق 7 دفعات refactor صغيرة، كل واحدة في commit مستقل وقابل للـrevert منفردًا. النتيجة: حذف 322 سطرًا وإضافة 82 عبر 13 ملفًا، إزالة كل استخدامات `any`، وصول ESLint إلى صفر تحذيرات، إزالة تكرار حقيقي في منطق الـscroll بين `Hero` و`Navbar`، واستخراج hooks مستقلة من أكثر ملف تعديلًا في المشروع.

أهم 3 findings:
1. **`HowItWork.tsx` كان يستخدم hook (`useT`) بدون `"use client"`** — كان يعمل فقط لأن `home.tsx` "يسرّب" حدوده إليه. استيراده من أي Server Component كان سيكسره. تم إصلاحه (بدون تغيير مكان التنفيذ)، وأصبحت صفحة الـhome نفسها Server Component.
2. **كسر RTL فعلي في `OnboardingIncomplete.tsx`** (`text-left` و`pl-5`) — سُجّل في الدفعة الأولى، و**أُصلح في الدفعة الثانية** (`7458c73`) بعد موافقة المراجع.
3. **8 ملفات بلا أي استخدام في الكود لكنها مذكورة في الـspecs** (منها `SpecularButton.tsx`، أكبر ملف في المشروع، 378 سطرًا) — **حُسمت وحُذفت في الدفعة الثانية**، بعد التحقق من أن الـspec قديم في كل حالة.

**مستوى الثقة في حفظ السلوك: مرتفع.** الأساس: typecheck/lint/tests/build نظيفة قبل وبعد، و`next build` يفرض قواعد server/client، إضافة إلى **تحقق runtime في متصفح حقيقي** بـ30 فحصًا موجّهًا لكل سلوك تم لمسه + مجموعات regression سابقة (152 فحصًا)، بكلا اللغتين. تنبيه: هذا التحقق الـruntime تم بسكربتات Playwright مؤقتة غير مضافة للـrepo — راجع Recommendations.

## Metrics (Before → After)

| المقياس | قبل | بعد |
|---|---|---|
| ملفات `"use client"` | 56 / 108 | 54 / 107 |
| أكبر ملف (أسطر) | `SpecularButton.tsx` 378 | `SpecularButton.tsx` 378 (غير مستخدم — لم يُلمس) |
| `Navbar.tsx` (أسطر) | 377 | 355 |
| استخدامات `any` | 1 سطر (3 tokens) في `apiSlice.ts:118` | 0 |
| `eslint-disable` | 3 | 2 (كلاهما مبرّر بتعليق) |
| أخطاء TypeScript | 0 | 0 |
| أخطاء/تحذيرات ESLint | 0 / 1 | 0 / 0 |

ملاحظة: `any` في `auth.ts:180` الذي يظهر في بحث نصي هو كلمة إنجليزية داخل تعليق، وليس type.
ملاحظة على `"use client"`: الانخفاض الصافي (−2) يخفي تغييرين: خرج `home.tsx` و`AuthAmbientDecor.tsx` من الـclient bundle، ودخل ملفا الـhooks الجديدان (convention المشروع: ملفات الـhooks تحمل `"use client"` مثل `useMobileMenu.ts`).

## Validation

| Check | Baseline | After | ملاحظة |
|---|---|---|---|
| TypeScript (`tsc --noEmit`) | Passed | Passed | |
| ESLint | Passed | Passed | التحذير الوحيد (`staggerDelay`) أُزيل |
| Tests (Vitest) | Passed | Passed | 19/19 في 10 ملفات |
| Build (`next build`) | Passed | Passed | المحاولة الأولى للـbaseline فشلت بخطأ شبكة عابر في `next/font/google`، ونجحت عند الإعادة — لا علاقة له بالكود |

### Runtime verification (Playwright، production build، `en` + `ar`)

| الفحص | النتيجة |
|---|---|
| فحوصات موجّهة لكل سلوك تم لمسه في هذا الـrefactor | 30/30 |
| Navbar — closed state (3 routes × 7 widths × 2 locales) | 42/42 |
| Navbar — open menu | 18/18 |
| القائمة لا تُزيح المحتوى عند الفتح | 8/8 |
| Responsive (3 routes × 9 widths × 2 locales) | 54/54 |
| توسيط عناوين الأقسام | 0 off-centre |
| أخطاء hydration في الـconsole | 0 |

الفحوصات الـ30 تغطي تحديدًا: ظهور الأقسام الستة بالترتيب من `home.tsx` كـServer Component؛ `useScrolledPast` (شفاف في الأعلى، elevated بعد الـscroll، يعود شفافًا)؛ `scrollToElement` (يهبط القسم على 88px بالضبط من روابط الـNavbar ومن زر الـHero، و`preventDefault` ما زال يمنع التنقل)؛ `useBodyScrollLock` (غير مقفل، مقفل عند الفتح، يُحرَّر بعد الإغلاق)؛ وظهور `AuthAmbientDecor` على `/auth`.

### Manual Verification Needed

- الصفحة الرئيسية `/en` و`/ar`: مرور بصري سريع على الأقسام الستة، ونقر روابط الـNavbar وزر "Explore" في الـHero.
- `/auth` و`/onboarding` بكلا اللغتين: خلفية الـdecor (أصبحت Server Component).
- قائمة الموبايل على **جهاز iOS Safari حقيقي**: قفل الـscroll عبر `body { overflow: hidden }` معروف بأنه غير كامل على iOS. السلوك **لم يتغير** في هذا الـrefactor (نُقل حرفيًا)، لكنه لم يُختبر على iOS.

## Commits

1. `e5d50d7` — refactor(cleanup): remove unused IconBounce, RevealImage and Shine
2. `00bf2f3` — refactor(api): drop duplicate AuthData and the any in OnStartedHandler
3. `4436b82` — refactor(animations): drop unused staggerDelay binding in ScrollStagger
4. `ea27cd1` — refactor(ui): share the scroll-to-section helper between Hero and Navbar
5. `c7a20da` — refactor(navbar): extract useScrolledPast and useBodyScrollLock hooks
6. `25b31ef` — refactor(home): give HowItWork its own client boundary; server-render the page
7. `ef4d907` — refactor(auth): render AuthAmbientDecor as a server component

## Files Changed

| الملف | ماذا تغيّر | لماذا | Behavior-preserving؟ وكيف تم التحقق |
|---|---|---|---|
| `src/shared/components/animations/IconBounce.tsx` | حُذف | unused مؤكد | نعم — راجع Removed Code |
| `src/shared/components/animations/RevealImage.tsx` | حُذف | unused مؤكد | نعم — راجع Removed Code |
| `src/shared/components/animations/Shine.tsx` | حُذف | unused مؤكد (ويحتوي نسخة قديمة كاملة معلّقة) | نعم — راجع Removed Code |
| `src/lib/api/apiSlice.ts` | حذف `AuthData` المكرر؛ `any` → `unknown`؛ تعليق على `.catch` | duplication + typing | نعم — type-only، لا runtime code. tsc + 15 test للـapi/auth |
| `src/shared/components/animations/ScrollStagger.tsx` | حذف binding غير مستخدم | تحذير ESLint الوحيد | نعم — لا يوجد `...rest`، فلا يمكن للـprop أن يتسرّب للـDOM |
| `src/lib/utils.ts` | إضافة `SECTION_SCROLL_OFFSET` و`scrollToElement` | إزالة التكرار | نعم — منقول حرفيًا؛ Playwright: 88px |
| `src/features/home/components/sections/Hero.tsx` | يستخدم الـhelper المشترك | إزالة التكرار | نعم — Playwright |
| `src/shared/components/layout/navbar/Navbar.tsx` | الـhelper + hookان مستخرجان | فصل المسؤوليات | نعم — ترتيب الـeffects محفوظ؛ 30+42+18+8 فحص |
| `src/shared/hooks/useScrolledPast.ts` | جديد | مسؤولية مستقلة | منقول حرفيًا |
| `src/shared/hooks/useBodyScrollLock.ts` | جديد | مسؤولية مستقلة | منقول حرفيًا |
| `src/features/home/components/sections/HowItWork.tsx` | إضافة `"use client"` | جعل dependency ضمنية صريحة | نعم — كان يعمل على الـclient أصلًا |
| `src/features/home/components/pages/home.tsx` | إزالة `"use client"` | الصفحة composition فقط | نعم — `next build` يفرضها؛ الأقسام الستة تظهر بالترتيب |
| `src/features/auth/components/AuthAmbientDecor.tsx` | إزالة `"use client"` | markup ثابت بلا hooks | نعم — نفس الـDOM؛ ظاهر على `/auth` |

## Components Refactored

لا يوجد تقسيم components. تم فقط تصحيح حدود server/client لثلاثة components (راجع Architecture Changes).

## Logic Refactored

- **منطق الـscroll إلى قسم** كان منسوخًا حرفيًا في `Hero.tsx` و`Navbar.tsx` (ثابت محلي `SCROLL_OFFSET = 88` + `scrollTo` يحترم reduced motion). النسختان تتغيران لنفس السبب (ارتفاع الـnavbar وتفضيل الحركة)، فنُقلتا إلى `scrollToElement` في `src/lib/utils.ts`. كل caller احتفظ بالـguard الخاص به (`querySelector` + `if (!target) return`)، و`Navbar` ما زال يستدعي `preventDefault` قبل الـscroll، فترتيب التنفيذ لم يتغير.

## Hooks Refactored

من `Navbar.tsx` (أكثر ملف تعديلًا في الـrepo — 16 commit) استُخرج hookان مسؤوليتهما مستقلة فعلًا عن الـnavbar، إلى `src/shared/hooks/` بجانب `useMobileMenu`:

- **`useScrolledPast(threshold)`** — يعرف إن تجاوزت الصفحة عددًا من البكسلات، مع قراءة عند الـmount.
- **`useBodyScrollLock(locked)`** — يقفل scroll الصفحة خلف overlay ويحرره دائمًا عند الـcleanup.

استُدعيا في نفس مواضع الـeffects الأصلية تمامًا، فبقي ترتيب التنفيذ (scroll ← body lock ← Escape) كما هو، وكلاهما قبل الـ`return null` المبكر على `/dashboard`.

لم يُستخرج معالج Escape ولا الـfocus trap: كلاهما يعتمد على الـref والـid الخاصين بقائمة الـnavbar، واستخراجهما يتطلب تمرير أكثر مما يوفّر.

## Architecture Changes

- **حدود server/client:** `home.tsx` أصبح Server Component (composition فقط)، و`AuthAmbientDecor.tsx` أصبح Server Component (markup ثابت يُمرَّر كـ`ReactNode` إلى `ShellBackground` الـclient). `HowItWork.tsx` أعلن حدوده الخاصة.
- لم يُنقل أي ملف، ولم يُلمس أي شيء داخل `app/`، ولم يُنشأ أي barrel file أو مجلد جديد.

## Removed Code

| العنصر | الموقع | سبب الحذف | طريقة التحقق أنه unused |
|---|---|---|---|
| `IconBounce` | `src/shared/components/animations/IconBounce.tsx` | unused | الشروط الخمسة كلها: (1) لا مرجع في `src/` و`tests/` ولا في docs/specs/configs؛ (2) ليس ملف framework؛ (3) الاستيراد الديناميكي الوحيد في التطبيق يحمّل `messages/*.json`، ولا يوجد component registry؛ (4) تطبيق واحد لا package؛ (5) tsc + lint نظيفان بعد الحذف |
| `RevealImage` | `src/shared/components/animations/RevealImage.tsx` | unused | نفس الشروط الخمسة |
| `Shine` | `src/shared/components/animations/Shine.tsx` | unused | نفس الشروط الخمسة (المرجع الوحيد لاسمه داخل الملف نفسه) |
| binding `staggerDelay` | `ScrollStagger.tsx:20` | متغير غير مستخدم | ESLint؛ لا يوجد `...rest` spread |
| `interface AuthData` المكرر | `apiSlice.ts:112` | نسخة ثانية مطابقة | TypeScript كان يدمج النسختين |

## Security Findings

| Severity | Location | Issue | Risk | Action / Status |
|---|---|---|---|---|
| Informational | `Backend/.env.example`، `Backend/.env.docker.example` | قيم `DB_PASSWORD` / `MYSQL_*` غير فارغة (redacted) | منخفض — كلها تحتوي كلمات dev-marker، أي افتراضات تطوير محلي في templates | لا إجراء. الـBackend خارج النطاق. ملفات `.env` الحقيقية **غير** متتبعة في git. توصية: التأكد أنها لا تُستخدم في production |
| Informational | route `/dashboard` | الحماية على الـroute تتم في الـclient فقط | منخفض — مقصود معماريًا: الـtokens في الذاكرة فقط (constitution)، فلا يمكن للـmiddleware قراءتها. البيانات نفسها محمية بـbearer token على الـAPI | Not Fixed — out of scope. يحتاج تأكيدًا من الـBackend أن كل endpoint يفرض الصلاحية |
| Informational | `src/shared/components/layout/navbar/Logo.tsx` | `rel="noopener noreferrer" target="_self"` على رابط داخلي | لا خطر — `noopener` بلا أثر على نفس التبويب، و`noreferrer` يحذف الـReferer من تنقل داخلي | Not Fixed — behavior change (header الـReferer) |

لا يوجد: `dangerouslySetInnerHTML`، روابط `target="_blank"`، open redirect، secrets مكتوبة في الكود. متغير `NEXT_PUBLIC_` الوحيد هو `NEXT_PUBLIC_API_BASE_URL` وهو عام بطبيعته.

## Technical Debt

| Severity | Location | Description | Risk | Recommendation | Status |
|---|---|---|---|---|---|
| Medium | `src/features/onboarding/components/OnboardingIncomplete.tsx:43,46` | `text-left` و`pl-5` (خصائص فيزيائية) | في `ar`: نص عربي مُجبر على اليسار، والـpadding في الجهة الخاطئة من علامات القائمة | `text-start` و`ps-5` | **Fixed — الدفعة الثانية (`7458c73`)** |
| Medium | 8 ملفات — راجع Potentially Unused Code | كود بلا أي استخدام لكنه مذكور في الـspecs | صيانة كود ميت، وspecs تصف واقعًا غير موجود | قرار منتج: حذف أو تحديث الـspecs | **Fixed — حُذفت في الدفعة الثانية** (تحديث الـspecs ما زال معلّقًا) |
| Low | `src/app/[locale]/(main)/dashboard/loading.tsx:3`، `src/shared/components/layout/Footer.tsx:42` | `aria-label` إنجليزي hardcoded (`"Loading dashboard"`، `"Footer navigation"`) | قارئ الشاشة يقرأها بالإنجليزية في `ar` | إضافة مفاتيح ترجمة لكلا اللغتين | **Pending content from the responsible team** |
| Low | `src/features/dashboard/components/pages/dashboard-page.tsx:75`، `src/features/onboarding/components/pages/onboarding-page.tsx:202` | نص `Loading…` إنجليزي hardcoded ظاهر للمستخدم (اكتُشف في الدفعة الثانية) | يظهر بالإنجليزية في الواجهة العربية | مفتاح ترجمة بصياغة معتمدة | **Pending content from the responsible team** |
| Low | `src/shared/components/layout/Footer.tsx:8-11` | روابط placeholder `href: "#"` (privacy/terms/trust/status) | روابط ميتة تقفز لأعلى الصفحة | ربطها بصفحات حقيقية أو إخفاؤها | **Pending content from the responsible team** (وجهات الروابط) |
| Informational | `messages/en.json`، `messages/ar.json` — namespace `aiLearningPath` | مفاتيح ترجمة يتيمة: تخص `AiLearningPathCard` الذي أُسقط، ولا يستخدمها أي كود | صيانة نصوص ميتة | حذفها بعد تأكيد فريق المحتوى | Not Fixed — needs approval (قاعدة الـskill: مفاتيح الترجمة تُسجَّل فقط) |
| Low | 24 ملفًا تستخدم `useT`، 17 تستخدم `useTranslations` مباشرة | عدم اتساق | `useT` يعيد fallback عند مفتاح ناقص بينما `useTranslations` يرمي — نفس الخطأ يتصرف بشكل مختلف حسب الـcomponent | توحيد على أحدهما | Not Fixed — behavior change عند المفاتيح الناقصة |
| Low | `src/features/onboarding/components/components/` | تداخل مكرر في التسمية | التباس بسيط | إعادة تسمية المجلد | Not Fixed — out of scope (تغيير في المسارات بلا فائدة سلوكية) |
| Low | `src/shared/components/layout/navbar/Navbar.tsx` | 355 سطرًا، Escape وfocus trap ما زالا inline | متوسط التعقيد | استخراج `useMenuKeyboard` إن احتاجه overlay آخر | Not Fixed — insufficient benefit |
| Informational | `docs/05-api-integration.md` | الوثيقة تقول إن الـauth في Redux + `localStorage` والإرسال عبر `onboardingService` | docs قديمة: الكود يستخدم in-memory token store وRTK Query | تحديث الوثيقة، مع specs/001 و005 (راجع Batch 2) | Not Fixed — out of scope |
| Informational | `next build` | يعتمد على جلب Google Fonts عبر الشبكة وقت البناء | فشل بناء عابر لوحظ مرتين أو أكثر في هذه الجلسة | `next/font/local` | Not Fixed — needs approval (تغيير infra) |

## Clean Code Improvements

- **Duplication:** إزالة نسختين متطابقتين من منطق الـscroll، وإعلان `AuthData` المكرر.
- **Typing:** إزالة آخر `any` في المشروع دون تغيير أي runtime code.
- **Responsibilities:** استخراج مسؤوليتين مستقلتين من `Navbar`.
- **Documentation:** تعليق يشرح لماذا الـ`.catch(() => {})` في `authPersistHandler` مقصود.
- **Formatting:** لا reformat جماعي؛ التعديلات محصورة في الملفات الملموسة.

## Performance Findings

- **مُصلح:** `home.tsx` و`AuthAmbientDecor.tsx` لم يعودا يُشحنان كـJS للـclient. السبب: لا يحتاجان أيًا من ميزات الـclient.
- **ملاحظة:** الأثر على حجم الـbundle صغير (ملفان قصيران)؛ القيمة الأساسية معمارية (الصفحة composition على الـserver، والأقسام تعلن حدودها بنفسها).
- لم تُضف أي memoization.

## Accessibility Findings

- **لم يُصلح شيء** في هذا الـrefactor.
- **الموجود — Pending content from the responsible team:** `aria-label` إنجليزي hardcoded في موضعين، وروابط الـFooter الميتة (راجع Technical Debt).
- **نظيف:** لا `div`/`span` بـ`onClick`، ولا صور بلا `alt`.

## i18n / RTL / LTR Findings

- **كسر RTL:** `OnboardingIncomplete.tsx:43,46` — سُجّل في الدفعة الأولى، و**أُصلح في الدفعة الثانية** (`7458c73`). لم يعد في `src/` أي `text-left` أو `pl-*` فيزيائي.
- **خصائص فيزيائية مقصودة (ليست أخطاء):** `AiCursor.tsx` (إحداثيات الماوس فيزيائية بطبيعتها)، `AuthAmbientDecor.tsx` (موثّق بتعليق داخل الملف)، `Hero.tsx` (`left-1/2 -translate-x-1/2` توسيط متماثل).
- **عدم اتساق** `useT` / `useTranslations` — مُسجَّل.
- **ترجمات ناقصة** لـ`aria-label` في موضعين، ولـ`Loading…` في موضعين — Pending content from the responsible team.

## Potentially Unused Code

لا يوجد بعد الدفعة الثانية. الملفات الثمانية التي كانت مسجّلة هنا حُسمت كلها وحُذفت، ولكل ملف خلاصة موثّقة في commit الحذف الخاص به وفي [Batch 2](#batch-2--follow-up-decisions).

## Warnings

1. ~~**انحراف الـspecs عن الكود.**~~ **حُسم في الدفعة الثانية:** الملفات الثمانية حُذفت. المتبقي أن الـspecs والـdocs نفسها لم تُحدَّث بعد (راجع "Specs / docs now out of date" في Batch 2).
2. **التحقق الـruntime غير محفوظ في الـrepo.** سلوك الـscroll والـhooks وحدود server/client، ثم إصلاح RTL في الدفعة الثانية، كلها تم التحقق منها بسكربتات Playwright مؤقتة. الـ19 test الموجودة تغطي طبقة الـAPI/auth فقط، ولا شيء منها يحمي هذه السلوكيات من regression مستقبلي.

## Bugs Observed (Not Fixed)

1. ~~**`ScrollStagger` يقبل `staggerDelay` ولا يطبّقه.**~~ زال مع حذف الـcomponent في الدفعة الثانية (`990bc4c`).
2. ~~**كسر RTL في `OnboardingIncomplete.tsx`.**~~ **أُصلح في الدفعة الثانية** (`7458c73`).
3. **روابط ميتة في الـFooter** (`href: "#"`) — Pending content from the responsible team.
4. **نصوص إنجليزية في الواجهة العربية:** `aria-label` في موضعين و`Loading…` في موضعين — Pending content from the responsible team.

## Remaining Technical Debt

1. تحديث الـspecs والـdocs المتأخرة عن الكود: `specs/001`، `specs/005`، `docs/05`، `docs/00`، `docs/03` (Medium)
2. **Pending content from the responsible team:** ترجمات `aria-label` و`Loading…`، ووجهات روابط الـFooter (Low)
3. حذف namespace الترجمة اليتيم `aiLearningPath` بعد تأكيد فريق المحتوى (Informational)
4. توحيد `useT` / `useTranslations` (Low)
5. self-hosting للخطوط لاستقرار الـbuild (Informational)

## Recommendations

لم يُنفَّذ أي منها:

- **إضافة Playwright e2e specs** في `tests/e2e/` تغطي: الـscroll إلى الأقسام، قفل الـscroll في قائمة الموبايل، ظهور الأقسام الستة، غياب أخطاء hydration، واتجاه قائمة `OnboardingIncomplete` في `ar`، بكلا اللغتين. الـtooling موجود أصلًا (`pnpm test:e2e`).
- **تحديث الـspecs والـdocs** لتعكس الكود الحالي (القائمة في Batch 2).
- **`next/font/local`** لإزالة اعتماد الـbuild على الشبكة؛ فشل البناء العابر تكرر في الدفعة الثانية أيضًا (مرتان).
- **توحيد استخدام الترجمة** بعد قرار صريح حول سلوك المفاتيح الناقصة.

---

## Batch 2 — Follow-up Decisions

### Summary

طُبّقت قرارات المراجع على نفس الـbranch في 9 commits مستقلة: حذف 8 ملفات غير مستخدمة (كل ملف في commit بخلاصته عن حالة الـspec)، وإصلاح كسر RTL في `OnboardingIncomplete.tsx`. النتيجة: 9 ملفات، **+2 / −829 سطرًا**. حُذف أكبر ملف في المشروع (`SpecularButton.tsx`، 379 سطرًا)، ولم يعد في `src/` أي خاصية اتجاه فيزيائية. بنود المحتوى (ترجمات `aria-label` وروابط الـFooter) لم تُلمس كما طُلب، وعُلّمت "Pending content from the responsible team".

**السؤال الحاكم لكل حذف:** هل الـspec قديم (الميزة أُسقطت فعلًا)، أم الكود ناقص (الـspec لم يُنفَّذ)؟ الجواب في الحالات الثماني: **الـspec قديم**. الدليل الحاسم لسبعة منها في `specs/001` نفسه: قرار التوضيح **Q24** ("Follow the Prototype Hero exactly") أسقط `AiLearningPathCard` والـHero القديم الذي كانت هذه الـcomponents تخدمه، ومتطلبات الـHero والـCTA الحالية (الأسطر 236-238، 256-257، 422، 439) تصف أزرار pill عادية تطابق الكود المنفَّذ حرفيًا. جدول "Existing Components to Reuse" هو inventory لم يُحدَّث بعد Q24، وفيه أصلًا مسار `Navbar` الميت. الملف الثامن `onboardingService` لم يُحسم من الـspecs وحدها، فسُئل المراجع قبل حذفه.

### Metrics (Before → After)

"قبل" = نهاية الدفعة الأولى.

| المقياس | قبل | بعد |
|---|---|---|
| ملفات TS/TSX في `src/` | 107 | 99 |
| ملفات `"use client"` | 54 | 47 |
| أكبر ملف (أسطر) | `SpecularButton.tsx` 378 | `Navbar.tsx` 355 |
| ملفات `shared/components/animations/` | 8 | 2 (`FadeInView`، `HeadingReveal`، وكلاهما مستخدم) |
| خصائص اتجاه فيزيائية (`text-left`، `pl-*`) | 2 | 0 |
| استخدامات `any` | 0 | 0 |
| `eslint-disable` | 2 | 2 |
| أخطاء TypeScript | 0 | 0 |
| أخطاء/تحذيرات ESLint | 0 / 0 | 0 / 0 |

### Validation

| Check | Before (نهاية الدفعة 1) | After (نهاية الدفعة 2) | ملاحظة |
|---|---|---|---|
| TypeScript | Passed | Passed | |
| ESLint | Passed (0 problems) | Passed (0 problems) | |
| Tests (Vitest) | Passed 19/19 | Passed 19/19 | |
| Build | Passed | Passed | نجح في المحاولة الثانية بعد خطأ شبكة عابر في `next/font/google` |

**بعد كل حذف** شُغّل typecheck + lint + build قبل الـcommit: 8/8 نجحت. بناء `TextReveal` احتاج إعادة محاولة واحدة لنفس خطأ الخطوط العابر.

### Commits

1. `c830c7e`: refactor(cleanup): remove unused AnimatedNumber
2. `8b0e5fd`: refactor(cleanup): remove unused AnimatedProgressBar
3. `493bf54`: refactor(cleanup): remove unused TextReveal
4. `990bc4c`: refactor(cleanup): remove unused ScrollStagger
5. `d464c81`: refactor(cleanup): remove unused MagneticBehavior
6. `98bde61`: refactor(cleanup): remove unused Card3D
7. `c49a25a`: refactor(cleanup): remove unused SpecularButton
8. `465e521`: refactor(cleanup): remove onboardingService tombstone
9. `7458c73`: fix(onboarding): use logical text-start/ps-5 in OnboardingIncomplete

### Removed Code: spec conclusion per file

قبل كل حذف تحقّق ما يلي: لا يستورد الملفَ أي كود في `src/` أو `tests/`، ولا يوجد barrel ولا استيراد ديناميكي يصل إليه، ولا يستورد أي مرشح مرشحًا آخر.

| الملف | أسطر | حالة الـspec | الدليل |
|---|---|---|---|
| `AnimatedNumber.tsx` | 49 | **قديم** | حذف مباشر بقرار المراجع. `specs/003/research.md` يرفضه صراحةً؛ `specs/001` يضعه "(if used)"؛ مستهلكه الوحيد `AiLearningPathCard` أُسقط في Q24 |
| `AnimatedProgressBar.tsx` | 53 | **قديم** | "(if used)" في `specs/001`؛ مستهلكه الوحيد `AiLearningPathCard` أُسقط في Q24. أسطر الـspec 601 و634 و887 تصف تلك البطاقة الساقطة |
| `TextReveal.tsx` | 79 | **قديم** | مستهلكوه: البطاقة الساقطة، و`Features`/`HowItWork` اللذان أُعيد بناؤهما على `HeadingReveal`/`FadeInView` في `34b5027`. الـplan يصفه "optional"، ولا يوجد متطلب وظيفي لتأثير text-reveal |
| `ScrollStagger.tsx` | 66 | **قديم** | مستهلكه الوحيد الـHero القديم الذي استبدله Q24، ومتطلبات الـHero لا تذكر stagger. (كان يحمل bug: `staggerDelay` لا يُطبَّق) |
| `MagneticBehavior.tsx` | 69 | **قديم** | مستهلكاه أزرار الـHero والـCTA القديمة. المتطلبات الحالية لكليهما أزرار `rounded-full` عادية بلا تأثير مغناطيسي (236-238، 256-257، 422، 439)\* |
| `Card3D.tsx` | 130 | **قديم** | مستهلكه الوحيد الـHero القديم (كان يغلّف البطاقة الساقطة). تفاعل البطاقات في الـspec هو lift (السطر 311)، ومنفَّذ في `FeatureCard`/`StepCard` بدونه |
| `SpecularButton.tsx` | 379 | **قديم** | الحالة الأدق: جدول الـreuse وT007 يسبقان Q24. بعد Q24 تحدد المتطلبات أزرار pill صلبة (primary `#12314D`، secondary `#DEEAFB`/`#1D4E89`) لا زر WebGL shader، والـplan يقول "Button.tsx **or** SpecularButton.tsx". الـHero والـCTA المنفَّذان يطابقان المتطلبات حرفيًا، فالكود غير ناقص |
| `onboardingService.ts` | 2 | **قديم** | لم يُحسم من الـspecs وحدها فسُئل المراجع، ووافق على الحذف. ثم تبيّن أن الملف نفسه **tombstone** من سطرين: `Removed as part of 006-frontend-api-integration. Onboarding now submits via RTK Query mutations`، وهذا دليل مباشر على أن الإسقاط كان مقصودًا |

\* رسالة commit `MagneticBehavior` تشير إلى "CTA section items 11 and 28"، وهذه أرقام نسبية داخل القسم؛ السطران الفعليان في `specs/001/spec.md` هما **422 و439**.

### RTL fix: `OnboardingIncomplete.tsx`

**التغيير:** `text-left` ← `text-start` على الـCard، و`pl-5` ← `ps-5` على القائمة. يطابق نمط المشروع الموجود (`text-start` ×8، `ps-`/`pe-` ×3). كانتا الخاصيتين الفيزيائيتين الوحيدتين في كامل `src/`.

**طريقة التحقق:** عُرض الـcomponent فعليًا في production build (صفحة `/dashboard` مع اعتراض `GET /me/onboarding-status` عبر Playwright ليعيد `completed: false`)، وقيست المواقع بالبكسل قبل الإصلاح وبعده، مع لقطات شاشة.

| Locale @ width | label (L / R) قبل ← بعد | ul padding (L / R) قبل ← بعد | أول عنصر (L / R) قبل ← بعد |
|---|---|---|---|
| en @ 375 | 21 / 230 ← 21 / 230 | 20 / 0 ← 20 / 0 | 20 / 244 ← 20 / 244 |
| en @ 1280 | 21 / 407 ← 21 / 407 | 20 / 0 ← 20 / 0 | 20 / 421 ← 20 / 421 |
| ar @ 375 | 21 / 243 ← **243 / 21** | 20 / 0 ← **0 / 20** | 20 / 239 ← **239 / 20** |
| ar @ 1280 | 21 / 420 ← **420 / 21** | 20 / 0 ← **0 / 20** | 20 / 416 ← **416 / 20** |

- **الإنجليزية: الـgeometry مطابقة حرفيًا قبل وبعد.** يتغير فقط `text-align` المحسوب من `left` إلى `start`، وهما متطابقان في LTR.
- **العربية: أصبحت مرآة دقيقة للإنجليزية.** قبل الإصلاح كان النص ملتصقًا باليسار والنقاط (•) عالقة على الحافة اليمنى منفصلة عن نصها؛ بعده أصبح النص والنقاط والـpadding كلها في الجهة اليمنى (inline-start).

### Pending content from the responsible team

لم تُلمس في هذه الدفعة بقرار المراجع، ولم يُخترع أي نص عربي أو وجهة رابط:

| الموقع | البند |
|---|---|
| `src/app/[locale]/(main)/dashboard/loading.tsx:3` | `aria-label="Loading dashboard"`: يحتاج ترجمة |
| `src/shared/components/layout/Footer.tsx:42` | `aria-label="Footer navigation"`: يحتاج ترجمة |
| `src/features/dashboard/components/pages/dashboard-page.tsx:75` | نص `Loading…` ظاهر: يحتاج ترجمة (**جديد** في هذه الدفعة) |
| `src/features/onboarding/components/pages/onboarding-page.tsx:202` | نص `Loading…` ظاهر: يحتاج ترجمة (**جديد** في هذه الدفعة) |
| `src/shared/components/layout/Footer.tsx:8-11` | روابط privacy/terms/trust/status تشير إلى `#`: تحتاج وجهات حقيقية |

### New findings (recorded only)

- **Namespace ترجمة يتيم `aiLearningPath`** في `messages/en.json` و`messages/ar.json`: نصوص `AiLearningPathCard` الساقطة، ولا يستخدمها أي كود. لم يُحذف لأن قاعدة الـskill تسجّل مفاتيح الترجمة فقط، وحذفها قرار محتوى.
- **نصّا `Loading…` hardcoded**: مدرجان في الجدول أعلاه.

### Specs / docs now out of date

لم تُعدَّل هنا لأنها خارج نطاق refactor الكود، لكنها الآن تصف كودًا لم يعد موجودًا:

- `specs/001-home-page-specification/spec.md`: جدول "Existing Components to Reuse" (~الأسطر 727-737) يذكر الـcomponents المحذوفة ومسار `Navbar` الميت؛ والأسطر 601 و634 و887 تخص البطاقة الساقطة.
- `specs/001-home-page-specification/plan.md` و`tasks.md`: ملاحظات `SpecularButton`/T007 و`TextReveal`.
- `specs/005-onboarding-ux-redesign/`: `contracts/onboarding-service.md` و`plan.md` و`research.md` وT004 في `tasks.md`.
- `docs/05-api-integration.md` و`docs/00-project-overview.md` و`docs/03-dashboard.md`: تذكر `onboardingService`.

---

## Investigation — reported 404 on `/en/auth` (not a code bug)

### البلاغ

بعد الدفعتين وصل بلاغ بأن `/en/auth` يعيد 404، وأن `Test-Path` على `src/app/[locale]/(main)/auth/page.tsx` يعيد `False` رغم أن `git status` نظيف. الفرضية المطروحة: أن فحص الـunused code في دفعة الحذف صنّف `page.tsx` (ملف framework مرتبط بالـrouting) خطأً كملف غير مستخدم وحذفه.

### ما وُجد فعلًا

الفرضية **لم تتحقق**. لم يُحذف الملف ولم يُنقل، والصفحة تعمل:

| الفحص | النتيجة |
|---|---|
| الملف على القرص (`find src/app -name page.tsx`) | موجود (306 bytes) |
| الملف متتبَّع في `HEAD` (`git ls-tree`) | نعم |
| محتواه مقارنةً بـ`main` | مطابق حرفيًا |
| أي commit من الـ18 على الـbranch لمس `src/app/` | لا (`git log main..HEAD -- src/app` فارغ) |
| production build — جدول الـroutes | يضم `/[locale]/auth` |
| `pnpm start`: `/en/auth` و`/ar/auth` | **200** و**200** (و`/en`، `/en/onboarding`، `/en/dashboard`: 200) |
| `pnpm dev`: `/en/auth` و`/ar/auth` | **200** و**200** |

### السبب الجذري لنتيجة `Test-Path`

في PowerShell، يُفسَّر المسار في `Test-Path` كـ**wildcard pattern**، والأقواس المربعة فيه هي character class. لذلك يُقرأ `[locale]` كـ"حرف واحد من l-o-c-a-e"، لا كمجلد اسمه حرفيًا `[locale]`، فلا يطابق شيئًا:

```powershell
Test-Path "src\app\[locale]\(main)\auth\page.tsx"               # False
Test-Path -LiteralPath "src\app\[locale]\(main)\auth\page.tsx"  # True
```

كل مسارات الـApp Router في هذا المشروع تمر بمجلد `[locale]`، لذلك سيعطي أي فحص PowerShell عليها بدون `-LiteralPath` نتيجة سالبة كاذبة. ينطبق الأمر نفسه على `Get-Item` و`Get-ChildItem` و`Copy-Item` وغيرها.

### السبب المرجّح للـ404

لم يتكرر الـ404 في أي من الوضعين. سبق أن ظهر في هذه الجلسة 404 مماثل على `/en` من `pnpm dev`، وكان السبب cache قديمًا لـTurbopack داخل `.next` بعد عدة builds فشل بعضها في منتصفها (خطأ Google Fonts العابر). هذا هو التفسير الأرجح هنا أيضًا، لكنه **غير مُثبت** لأن الحالة لم تتكرر. إن عاد: `rm -rf .next` ثم `pnpm dev`.

### إعادة فحص كل الملفات المحذوفة

لأن الفرضية كانت أن فحص الـunused صنّف ملف framework خطأً، أُعيد فحص الملفات الـ11 المحذوفة على الـbranch كلها:

- **ولا واحد منها تحت `src/app/`.** كلها في `src/shared/components/animations/`، و`src/shared/components/ui/SpecularButton.tsx`، و`src/features/onboarding/services/onboardingService.ts`.
- **ولا واحد منها يحمل اسم ملف framework** (`page`، `layout`، `loading`، `error`، `not-found`، `route`، `default`، `middleware`/`proxy`، `template`، `icon`، `sitemap`، `robots`، `manifest`، ...).
- **لا يوجد أي rename أو move** على الـbranch (`--diff-filter=R` فارغ).

قاعدة الـskill التي تستثني ملفات الـframework من فحص الـunused طُبّقت فعلًا: لم يُلمس أي شيء داخل `app/`.

### Validation

| Check | النتيجة |
|---|---|
| TypeScript | Passed |
| ESLint | Passed (0 problems) |
| Build | Passed؛ جدول الـroutes يضم `/[locale]/auth` |
| `/en/auth`، `/ar/auth` (prod + dev) | 200 |

### Action

**لا تغيير في الكود.** لا يوجد ما يُستعاد، والملف سليم ومطابق لـ`main`. التوصية: استخدام `-LiteralPath` في أي سكربت أو فحص PowerShell يتعامل مع مسارات `src/app/[locale]/...`.
