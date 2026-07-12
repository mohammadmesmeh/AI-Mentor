# AI Mentor — Project Overview / نظرة عامة على المشروع

> Bilingual doc (EN + AR). English first, Arabic after each section.
> وثيقة ثنائية اللغة (إنجليزي + عربي). الإنجليزي أولاً ثم العربي بعد كل قسم.

---

## 1. What is AI Mentor?

**AI Mentor** is a web platform where a learner interacts with an AI-powered mentor
that guides their learning journey. The mentor helps the user:

- Build a personalized learning plan (roadmap) based on their goals and level.
- Ask technical questions and get clear, contextual answers.
- Track progress across topics and receive next-step recommendations.
- Get feedback on tasks and exercises.

The product is being built by trainees as a hands-on, real-world project to
practice modern full-stack development, teamwork, and a clean Git workflow.

**ما هو AI Mentor؟**

**AI Mentor** هو منصة ويب يتفاعل فيها المتعلّم مع مرشد ذكي مدعوم بالذكاء الاصطناعي
يرافقه في رحلة تعلّمه. يساعد المرشد المستخدم على:

- بناء خطة تعلّم شخصية (Roadmap) حسب أهدافه ومستواه.
- طرح الأسئلة التقنية والحصول على إجابات واضحة ومناسبة للسياق.
- متابعة تقدّمه عبر المواضيع والحصول على توصيات بالخطوة التالية.
- الحصول على ملاحظات (Feedback) على المهام والتمارين.

المشروع يبنيه المتدربون كمشروع تطبيقي واقعي لممارسة تطوير الويب الحديث (Full-stack)،
والعمل الجماعي، وأسلوب عمل منظّم على Git.

---

## 2. Goals of this project (for trainees)

The project is not only a product — it is a **learning environment**. By the end,
each trainee should be comfortable with:

1. Building UI with **Next.js (App Router) + React + TypeScript + Tailwind CSS**.
2. Structuring a scalable codebase (components, pages, styles, utilities).
3. Working with a **Git branching workflow** (feature branches, clear commits, Pull Requests).
4. Connecting front-end to back-end APIs.
5. Reading requirements from a task and delivering it end-to-end.

**أهداف المشروع (للمتدربين)**

المشروع ليس منتجاً فقط — بل **بيئة تعلّم**. في النهاية، على كل متدرب أن يتقن:

1. بناء الواجهات باستخدام **Next.js (App Router) + React + TypeScript + Tailwind CSS**.
2. تنظيم مشروع قابل للتوسّع (مكوّنات، صفحات، تنسيقات، أدوات مساعدة).
3. العمل بأسلوب **فروع Git** (فروع للميزات، commits واضحة، Pull Requests).
4. ربط الواجهة الأمامية بالـ APIs في الخلفية.
5. قراءة متطلبات التاسك وتسليمه كاملاً من البداية للنهاية.

---

## 3. High-level scope

| Area | Description |
| --- | --- |
| **Front-end** | Next.js App Router, reusable components, responsive UI, dark mode. |
| **Back-end** | REST/API routes for auth, chat, plans, and progress tracking. |
| **AI layer** | Integration with an AI model to power mentor responses. |
| **Data** | Users, learning plans, conversations, and progress records. |

> The exact back-end and AI provider are decided in later phases. Early phases focus
> on the front-end foundation and project structure.

**النطاق العام**

| المجال | الوصف |
| --- | --- |
| **الواجهة الأمامية** | Next.js App Router، مكوّنات قابلة لإعادة الاستخدام، تصميم متجاوب، وضع ليلي. |
| **الخلفية** | مسارات API للمصادقة، المحادثة، الخطط، وتتبّع التقدّم. |
| **طبقة الذكاء** | التكامل مع نموذج ذكاء اصطناعي لتشغيل ردود المرشد. |
| **البيانات** | المستخدمون، خطط التعلّم، المحادثات، وسجلات التقدّم. |

> تُحدَّد الخلفية ومزوّد الذكاء الاصطناعي في المراحل اللاحقة. المراحل الأولى تركّز على
> أساس الواجهة الأمامية وهيكلة المشروع.

---

## 4. Documentation map / خريطة التوثيق

| File | Content |
| --- | --- |
| [00-overview.md](00-overview.md) | Project vision & scope / رؤية المشروع ونطاقه |
| [01-tech-stack.md](01-tech-stack.md) | Tech stack & how to run / التقنيات وطريقة التشغيل |
| [02-phases.md](02-phases.md) | Development phases / مراحل التطوير |
| [03-project-structure.md](03-project-structure.md) | Folder structure & conventions / الهيكل والاصطلاحات |
| [04-git-workflow.md](04-git-workflow.md) | Git workflow & commit rules / سير عمل Git وقواعد الـ commits |
| [tasks/](tasks/) | Trainee tasks / مهام المتدربين |
