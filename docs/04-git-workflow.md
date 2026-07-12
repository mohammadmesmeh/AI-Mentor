# Git Workflow & Commit Rules / سير عمل Git وقواعد الـ Commits

> This is how the whole team collaborates. Please follow it for every task.
> هذه طريقة تعاون الفريق كاملاً. الرجاء الالتزام بها في كل تاسك.

---

## 1. Branching model / نموذج الفروع

- `main` → stable, always working. **No direct commits.**
- `docs` → documentation updates.
- `feature/<name>` → a new feature or task.
- `fix/<name>` → a bug fix.

Examples / أمثلة:

```
feature/landing-home
feature/auth-pages
fix/navbar-mobile-menu
```

`main` هو الفرع المستقر ويجب أن يعمل دائماً — **ممنوع الـ commit المباشر عليه**.
كل تاسك يبدأ من فرع جديد باسم `feature/...`.

---

## 2. Standard workflow / سير العمل القياسي

```bash
# 1) Update main / حدّث الفرع الرئيسي
git checkout main
git pull origin main

# 2) Create a task branch / أنشئ فرع التاسك
git checkout -b feature/landing-home

# 3) Work + commit in small steps / اعمل و commit بخطوات صغيرة
git add .
git commit -m "feat(home): add hero section"

# 4) Push the branch / ارفع الفرع
git push -u origin feature/landing-home

# 5) Open a Pull Request on GitHub → request review
# افتح Pull Request على GitHub واطلب المراجعة
```

---

## 3. Commit message convention / اصطلاح رسائل الـ Commit

We use **Conventional Commits**: `type(scope): short description`

| Type | When to use |
| --- | --- |
| `feat` | A new feature / ميزة جديدة |
| `fix` | A bug fix / إصلاح خطأ |
| `docs` | Documentation only / توثيق فقط |
| `style` | Formatting, no logic change / تنسيق بدون تغيير منطق |
| `refactor` | Code change, no feature/fix / إعادة هيكلة |
| `chore` | Config, deps, tooling / إعدادات وأدوات |

Good examples / أمثلة جيدة:

```
feat(home): add responsive hero section
fix(navbar): close mobile menu on link click
docs(readme): add setup instructions
refactor(ui): extract Button component
```

Rules / قواعد:
- Write in the **imperative** ("add", not "added").
- Keep the summary under ~60 characters.
- One logical change per commit — avoid huge commits.

اكتب الرسالة بصيغة الأمر، أبقِ الملخّص قصيراً، واجعل كل commit تغييراً منطقياً واحداً.

---

## 4. Pull Request checklist / قائمة تحقّق الـ Pull Request

Before requesting review / قبل طلب المراجعة:

- [ ] Branch is up to date with `main` / الفرع محدّث مع `main`
- [ ] `pnpm lint` passes / يمرّ الفحص
- [ ] `pnpm build` passes / يمرّ البناء
- [ ] PR title follows commit convention / عنوان الـ PR يتبع الاصطلاح
- [ ] Description explains **what** and **why** / الوصف يشرح ماذا ولماذا
- [ ] Screenshots for UI changes / صور للتغييرات في الواجهة

---

## 5. Golden rules / قواعد ذهبية

1. Never push directly to `main` / لا ترفع مباشرة على `main`.
2. Pull before you start / اسحب آخر تحديث قبل البدء.
3. Small, frequent commits / commits صغيرة ومتكرّرة.
4. Never commit secrets or `.env` files / لا ترفع الأسرار أو ملفات `.env`.
5. Ask for review — don't self-merge without approval / اطلب مراجعة قبل الدمج.
