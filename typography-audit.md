# Typography Audit Report — AI Mentor

## 1. Font Installation

| Font | Status | File | Variables | Weights | Subsets |
|---|---|---|---|---|---|
| Space Grotesk | ✅ Installed | `layout.tsx:18-22` | `--font-space` | 400, 500, 600, 700 | latin |
| Nunito | ✅ Installed | `layout.tsx:36-40` | `--font-nunito` | 400, 500, 600, 700, 800 | latin |
| IBM Plex Sans Arabic | ✅ Installed | `layout.tsx:24-28` | `--font-arabic` | 400, 500, 600, 700 | arabic |
| Rubik | ✅ Installed | `layout.tsx:30-34` | `--font-rubik` | 400, 500, 600, 700 | arabic |

All four fonts are loaded via `next/font/google` in a single file: `src/app/[locale]/layout.tsx:3`.

All four CSS variables (`--font-space`, `--font-nunito`, `--font-arabic`, `--font-rubik`) are created and attached to the `<html>` element at line 73.

---

## 2. Root Layout Integration

**File:** `src/app/[locale]/layout.tsx`

### ✅ Font variables on `<html>`
Line 73: `className={`${theme} ${spaceGrotesk.variable} ${ibmPlexSansArabic.variable} ${rubik.variable} ${nunito.variable} h-full antialiased`}`

All four `variable` strings are applied to the `<html>` element, making them globally available as CSS custom properties.

### ✅ `dir` attribute handling
Line 72: `dir={locale === "ar" ? "rtl" : "ltr"}`

Correctly switches `dir` based on locale. The `[dir="rtl"]` selector in `globals.css:530-533` swaps `--font-default` and `--font-ui` accordingly.

### ⚠️ Locale-based font behavior
- `--font-default` maps to `--font-space` (Space Grotesk) in both `:root`/`.dark` (line 398) and `.light` (line 467).
- `[dir="rtl"]` switches `--font-default` to `--font-arabic` (IBM Plex Sans Arabic) at line 531.
- RTL switch fires on `[dir="rtl"]` — purely attribute-based. Correct but relies on `dir` being set properly.

### ✅ Global availability
Font variables are attached to `<html>`, so they cascade to all children. No additional per-component font loading needed.

---

## 3. globals.css Audit

**File:** `src/app/globals.css`

### 3a. `@theme` block (lines 122-324)

| Token | Value | Notes |
|---|---|---|
| `--font-display` | `"Space Grotesk", "IBM Plex Sans Arabic", ...` | ✅ Static fallback stack |
| `--font-body` | `"Space Grotesk", "IBM Plex Sans Arabic", ...` | ✅ Static fallback stack |
| `--font-code` | `"Geist Mono", "JetBrains Mono", ...` | ✅ Static fallback stack |
| `--font-weight-regular` | 400 | ✅ |
| `--font-weight-medium` | 500 | ✅ |
| `--font-weight-semibold` | 600 | ✅ |
| `--font-weight-bold` | 700 | ✅ |
| Type scale (`--text-display-2xl` through `--text-overline`) | Full scale | ✅ 17 steps with line-heights |
| Letter spacing (`--tracking-*`) | 6 steps | ✅ |
| Radius, shadows, easing, animations | Complete | ✅ |

### 3b. `@theme inline` block (lines 335-391)

| Token | Mapping | Notes |
|---|---|---|
| `--font-heading` | `var(--font-default)` | ✅ Points to locale-adaptive font |
| `--font-sans` | `var(--font-default)` | ✅ Tailwind `font-sans` uses locale font |
| `--font-body` | `var(--font-default)` | ✅ |
| `--font-display` | `var(--font-default)` | ✅ |
| `--font-ui` | `var(--font-nunito)` | ⚠️ Always Nunito regardless of locale (overridden by `[dir="rtl"]` below) |

### 3c. Theme variable blocks

**`:root` / `.dark` (lines 396-462):**
- `--font-default: var(--font-space)` ✅
- `--font-ui: var(--font-nunito)` ✅

**`.light` (lines 466-524):**
- `--font-default: var(--font-space)` ✅
- `--font-ui: var(--font-nunito)` ✅

**`[dir="rtl"]` (lines 530-533):**
- `--font-default: var(--font-arabic)` ✅
- `--font-ui: var(--font-rubik)` ✅

### 3d. Typography utilities (lines 542-583)

| Selector | Font | Weight | Notes |
|---|---|---|---|
| `h1, h2, h3, h4` | `var(--font-display)` | 600 (semibold) | ✅ Maps to locale font |
| `body` | `var(--font-body)` | (inherits) | ✅ Maps to locale font |
| `p, li` | (inherits `--font-body`) | 400 (regular) | ✅ |
| `code, kbd, samp` | `var(--font-code)` | (inherits) | ✅ Geist Mono stack |

---

## 4. Component Font Usage

| Component | Font approach | Notes |
|---|---|---|
| **Navbar** (`Navbar.tsx`) | No explicit font-family; inherits from body/Tailwind defaults | ✅ Relies on `font-sans: var(--font-default)` |
| **Footer** (`Footer.tsx`) | No explicit font-family; inherits | ✅ |
| **Logo** (`Logo.tsx`) | No explicit font-family; uses `font-bold` class | ✅ Inherits locale font |
| **Button** (`Button.tsx`) | `font-medium` via CVA | ✅ Inherits from Tailwind `font-sans` |
| **SpecularButton** (`SpecularButton.tsx`) | `font-medium` inline | ✅ Inherits |
| **FeatureCard** (`FeatureCard.tsx`) | `font-semibold` on h3, `text-sm text-muted-foreground` on p | ✅ Inherits |
| **Card** (`card.tsx` shadcn) | `font-semibold leading-none tracking-tight` on CardTitle | ✅ Inherits |
| **ThemeToggle** (`ThemeToggle.tsx`) | `font-medium` | ✅ Inherits |
| **LanguageSwitcher** (`LanguageSwitcher.tsx`) | `font-medium` | ✅ Inherits |
| **CTA/Hero** sections | `font-bold tracking-tight` on headings | ✅ Inherits |
| **TextReveal** (`TextReveal.tsx`) | No font overrides; passes className through | ✅ Inherits |

---

## 5. Findings

### ✅ Issue 1: `btn-base` utility hardcodes `--font-ui`

**File:** `globals.css:729`

In RTL, `--font-ui` resolves to `var(--font-rubik)`. **Intentional** per spec.

### ✅ Issue 2: `body` uses `--font-body` while Tailwind `font-sans` maps to `--font-default`

Both resolve to the same value (`--font-space` LTR, `--font-arabic` RTL). No conflict.

### ✅ Issue 3: `--font-ui` defaults to `var(--font-nunito)` before RTL override

`[dir="rtl"]` at line 532 correctly overrides to `var(--font-rubik)` with higher specificity.

### ⚠️ Issue 4: `@theme` static font stacks are cosmetic

Lines 216-218 define literal font name fallbacks like `"Space Grotesk", "IBM Plex Sans Arabic", ...` but these are never actually referenced at runtime. The actual font rendering comes from `:root`/`.dark`/`.light`/`[dir="rtl"]` CSS variables that point to `var(--font-space)` etc. The `@theme` stacks are dead code.

### ⚠️ Issue 5: `font-nunito` utility exists but is unused

`globals.css:811-813` — opt-in utility, no component currently uses it. Intentional.

### ✅ Issue 6: Base layer headings use `--font-display`

Maps to `var(--font-default)` which switches per locale. Correct.

---

## Summary

| Category | Status | Notes |
|---|---|---|
| **Font installation** | ✅ All 4 fonts installed | Correct weights, subsets, CSS variables |
| **CSS variables** | ✅ All 4 variables exist | `--font-space`, `--font-nunito`, `--font-arabic`, `--font-rubik` |
| **Layout integration** | ✅ Fonts on `<html>`, dir handled | Locale-based switching correct |
| **Theme variables** | ✅ LTR/RTL font switching correct | `:root`/`.dark`/`.light`/`[dir="rtl"]` all consistent |
| **Type scale** | ✅ Complete | 17 steps, proper line-heights, letter-spacing, weights |
| **Component usage** | ✅ All inherit correctly | No hardcoded fonts in components |
| **`@theme` static stacks** | ⚠️ Non-functional fallbacks | Point to font names not next/font variables (cosmetic only) |
| **Tailwind integration** | ✅ All semantic font utilities wired | `font-sans`, `font-heading`, `font-body`, `font-display`, `font-ui` |

**Verdict:** The typography system is correctly implemented and complete. The only notable finding is that the `@theme` static font stacks (lines 216-218) are decorative — they define literal font names that are never referenced. Actual font rendering flows correctly: next/font → CSS vars → semantic theme tokens → element styles.
