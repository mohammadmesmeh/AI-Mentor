# Refactor Report — AI Mentor (frontend)

Branch: `refactor/code-quality-review` (based on `main` @ `c28e030`) · 7 commits · **not pushed**

## Executive Summary

تمت مراجعة هندسية كاملة للـfrontend وتطبيق 7 دفعات refactor صغيرة، كل واحدة في commit مستقل وقابل للـrevert منفردًا. النتيجة: حذف 322 سطرًا وإضافة 82 عبر 13 ملفًا، إزالة كل استخدامات `any`، وصول ESLint إلى صفر تحذيرات، إزالة تكرار حقيقي في منطق الـscroll بين `Hero` و`Navbar`، واستخراج hooks مستقلة من أكثر ملف تعديلًا في المشروع.

أهم 3 findings:
1. **`HowItWork.tsx` كان يستخدم hook (`useT`) بدون `"use client"`** — كان يعمل فقط لأن `home.tsx` "يسرّب" حدوده إليه. استيراده من أي Server Component كان سيكسره. تم إصلاحه (بدون تغيير مكان التنفيذ)، وأصبحت صفحة الـhome نفسها Server Component.
2. **كسر RTL فعلي في `OnboardingIncomplete.tsx`** (`text-left` و`pl-5`) — مُسجَّل ولم يُصلح لأن إصلاحه تغيير مرئي.
3. **8 ملفات بلا أي استخدام في الكود لكنها مذكورة في الـspecs** (منها `SpecularButton.tsx`، أكبر ملف في المشروع، 378 سطرًا) — انحراف بين الـspecs والكود يحتاج قرارًا.

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
| Medium | `src/features/onboarding/components/OnboardingIncomplete.tsx:43,46` | `text-left` و`pl-5` (خصائص فيزيائية) | في `ar`: نص عربي مُجبر على اليسار، والـpadding في الجهة الخاطئة من علامات القائمة | `text-start` و`ps-5` | Not Fixed — behavior change (مرئي في RTL) |
| Medium | 8 ملفات — راجع Potentially Unused Code | كود بلا أي استخدام لكنه مذكور في الـspecs | صيانة كود ميت، وspecs تصف واقعًا غير موجود | قرار منتج: حذف أو تحديث الـspecs | Not Fixed — needs approval |
| Low | `src/app/[locale]/(main)/dashboard/loading.tsx:3`، `src/shared/components/layout/Footer.tsx:42` | `aria-label` إنجليزي hardcoded (`"Loading dashboard"`، `"Footer navigation"`) | قارئ الشاشة يقرأها بالإنجليزية في `ar` | إضافة مفاتيح ترجمة لكلا اللغتين | Not Fixed — needs approval (لا توجد مفاتيح، ولا تُخترع ترجمات) |
| Low | `src/shared/components/layout/Footer.tsx:8-11` | روابط placeholder `href: "#"` (privacy/terms/trust/status) | روابط ميتة تقفز لأعلى الصفحة | ربطها بصفحات حقيقية أو إخفاؤها | Not Fixed — behavior change |
| Low | 24 ملفًا تستخدم `useT`، 17 تستخدم `useTranslations` مباشرة | عدم اتساق | `useT` يعيد fallback عند مفتاح ناقص بينما `useTranslations` يرمي — نفس الخطأ يتصرف بشكل مختلف حسب الـcomponent | توحيد على أحدهما | Not Fixed — behavior change عند المفاتيح الناقصة |
| Low | `src/features/onboarding/components/components/` | تداخل مكرر في التسمية | التباس بسيط | إعادة تسمية المجلد | Not Fixed — out of scope (تغيير في المسارات بلا فائدة سلوكية) |
| Low | `src/shared/components/layout/navbar/Navbar.tsx` | 355 سطرًا، Escape وfocus trap ما زالا inline | متوسط التعقيد | استخراج `useMenuKeyboard` إن احتاجه overlay آخر | Not Fixed — insufficient benefit |
| Informational | `docs/05-api-integration.md` | الوثيقة تقول إن الـauth في Redux + `localStorage` والإرسال عبر `onboardingService` | docs قديمة: الكود يستخدم in-memory token store وRTK Query | تحديث الوثيقة | Not Fixed — out of scope |
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
- **الموجود:** `aria-label` إنجليزي hardcoded في موضعين (راجع Technical Debt)؛ روابط الـFooter الميتة.
- **نظيف:** لا `div`/`span` بـ`onClick`، ولا صور بلا `alt`.

## i18n / RTL / LTR Findings

- **كسر RTL:** `OnboardingIncomplete.tsx:43,46` — مُسجَّل فقط لأن إصلاحه تغيير مرئي.
- **خصائص فيزيائية مقصودة (ليست أخطاء):** `AiCursor.tsx` (إحداثيات الماوس فيزيائية بطبيعتها)، `AuthAmbientDecor.tsx` (موثّق بتعليق داخل الملف)، `Hero.tsx` (`left-1/2 -translate-x-1/2` توسيط متماثل).
- **عدم اتساق** `useT` / `useTranslations` — مُسجَّل.
- **ترجمات ناقصة** لـ`aria-label` في موضعين — مُسجَّل.

## Potentially Unused Code

| العنصر | الموقع | سبب الشك | لماذا لم يُحذف |
|---|---|---|---|
| `onboardingService` | `src/features/onboarding/services/onboardingService.ts` | لا يستورده أي ملف؛ الكود يستخدم RTK Query مباشرة | **contract في spec رسمي** (`specs/005-onboarding-ux-redesign/contracts/onboarding-service.md`)، وT004 مُعلَّم منجزًا، و`docs/05` يصفه كمسار الإرسال |
| `SpecularButton` | `src/shared/components/ui/SpecularButton.tsx` (378 سطرًا — الأكبر) | لا يستورده أي ملف | `specs/001` يصفه بأنه "Hero and CTA primary buttons"، والـHero يستخدم `<button>` عاديًا الآن |
| `TextReveal`، `ScrollStagger`، `MagneticBehavior`، `Card3D`، `AnimatedProgressBar` | `src/shared/components/animations/` | لا يستوردها أي ملف | مُدرجة في جدول components لـ`specs/001` |
| `AnimatedNumber` | `src/shared/components/animations/AnimatedNumber.tsx` | لا يستورده أي ملف | مُدرج في `specs/001`، لكن `specs/003/research.md` **رفضه صراحةً** ("AnimatedNumber/donut variants rejected") — أقوى مرشح للحذف |

## Warnings

1. **انحراف الـspecs عن الكود.** ثمانية ملفات تصفها الـspecs بأنها مستخدمة أو جزء من contract بينما لا يستوردها شيء. `CLAUDE.md` ينص على أن الـspecs هي "the authoritative design"، لذلك حذفها قرار منتج لا قرار refactor.
   - **الخطر:** كود ميت يُصان، وspecs تضلّل من يقرأها.
   - **الحل المقترح:** إما حذف الملفات وتحديث الـspecs، أو إعادة ربطها (مثل `SpecularButton` في الـHero).
   - **لماذا لم يُنفَّذ:** يحتاج موافقة، والـskill يمنع حذف ما لم يُتأكد أنه unused.
2. **التحقق الـruntime غير محفوظ في الـrepo.** سلوك الـscroll والـhooks وحدود server/client تم التحقق منه بسكربتات Playwright مؤقتة. الـ19 test الموجودة تغطي طبقة الـAPI/auth فقط، ولا شيء منها يحمي هذه السلوكيات من regression مستقبلي.

## Bugs Observed (Not Fixed)

1. **`ScrollStagger` يقبل `staggerDelay` ولا يطبّقه** — الـprop في الـinterface لكن لا أثر له. (الـcomponent غير مستخدم حاليًا.)
2. **كسر RTL في `OnboardingIncomplete.tsx`** — راجع Technical Debt.
3. **روابط ميتة في الـFooter** (`href: "#"`).
4. **`aria-label` إنجليزي في الواجهة العربية** — موضعان.

## Remaining Technical Debt

1. RTL في `OnboardingIncomplete.tsx` (Medium)
2. قرار بشأن 8 ملفات spec-referenced غير مستخدمة (Medium)
3. ترجمات `aria-label` الناقصة (Low)
4. روابط الـFooter الميتة (Low)
5. توحيد `useT` / `useTranslations` (Low)
6. تحديث `docs/05-api-integration.md` (Informational)
7. self-hosting للخطوط لاستقرار الـbuild (Informational)

## Recommendations

لم يُنفَّذ أي منها:

- **إضافة Playwright e2e specs** في `tests/e2e/` تغطي: الـscroll إلى الأقسام، قفل الـscroll في قائمة الموبايل، ظهور الأقسام الستة، وغياب أخطاء hydration — بكلا اللغتين. الـtooling موجود أصلًا (`pnpm test:e2e`).
- **إصلاح RTL** في `OnboardingIncomplete.tsx` في commit مستقل مع مراجعة بصرية.
- **مراجعة الـspecs مقابل الكود** وحسم مصير الملفات الثمانية.
- **`next/font/local`** لإزالة اعتماد الـbuild على الشبكة.
- **توحيد استخدام الترجمة** بعد قرار صريح حول سلوك المفاتيح الناقصة.
