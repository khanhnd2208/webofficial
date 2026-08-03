# Project Log (Nhật ký dự án)

Dự án: **my-teaching-platform** — *Website thầy giáo NDK*  
Stack: **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + MongoDB (Mongoose) + Auth.js/NextAuth (Google OAuth + JWT RBAC)**

> Mục tiêu file này: lưu dấu tiến trình + quyết định kỹ thuật + cách test để người mới vào dự án có thể đọc và hiểu nhanh.

---

## 0) Thông tin môi trường (Local)

- OS: macOS
- MongoDB local: `mongodb://127.0.0.1:27017/my_teaching_platform`
- Lưu ý đường dẫn workspace: thư mục cha có **khoảng trắng ở cuối** `Website ` → khi chạy lệnh nên để trong dấu nháy.

Ví dụ:

```bash
cd "/Users/duykhanh/Documents/Website /my-teaching-platform"
npm run dev
```

### Biến môi trường

File: `.env.local`

- `MONGODB_URI` (bắt buộc)
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `ADMIN_EMAIL` (email Google được gán role `admin`)

---

## 1) Mốc triển khai (Timeline)

### 1.1 Khởi tạo dự án & kiến trúc

- Tạo dự án Next.js App Router + TypeScript.
- Thiết lập Tailwind CSS v4.
- Thiết kế kiến trúc dạng layer để dễ mở rộng:
  - `models/` (Mongoose schema)
  - `services/` (business logic)
  - `app/api/` (route handlers mỏng)
  - `types/` (DTO/type)
  - `lib/` (hạ tầng: db connect, auth scaffold)
  - `utils/` (pure helper)

### 1.2 MongoDB + Mongoose

- Cài `mongoose`.
- Thêm `src/lib/dbConnect.ts` theo pattern singleton (an toàn khi hot-reload).

### 1.3 Middleware guard (admin)

- Thêm `src/middleware.ts` bảo vệ `/dashboard/*` và `/admin/*`.
- Dùng `next-auth/jwt getToken()` để đọc JWT trong cookie.
- Rules:
  - Chưa login → redirect `/login?from=...`
  - Đã login nhưng vào `/admin/*` mà `role !== 'admin'` → redirect `/dashboard`
  - (Optional) Đã login mà cố vào `/login` → redirect `/dashboard`

### 1.4 Phase 0 (example) — Grades API

- Model/Service/API ví dụ: Grade
  - `src/models/Grade.ts`
  - `src/services/gradeService.ts`
  - `src/app/api/grades/route.ts`

### 1.5 Phase 1 — Public Blog (MVP)

- Post model/service/API + public pages:
  - `src/models/Post.ts`
  - `src/services/postService.ts`
  - `src/app/api/posts/route.ts` (GET list + POST create)
  - `src/app/api/posts/[slug]/route.ts` (GET detail)
  - `src/app/blog/page.tsx` (list + tags + pagination)
  - `src/app/blog/[slug]/page.tsx` (detail markdown)
- Markdown rendering:
  - `react-markdown` + `remark-gfm`

### 1.6 Phase 1 — Markdown CMS (Admin)

- Writer Studio (create): `src/app/admin/posts/create/page.tsx`
  - Auto-slug từ title (`src/utils/slugify.ts`)
  - Field: title/slug/summary/tags/thumbnailUrl/isPublished/content
  - Save gọi `POST /api/posts`
- Admin Posts List: `src/app/admin/posts/page.tsx`
  - Có filter Draft/Published
  - Có actions: Sửa/Xem/Xoá
- Admin Edit: `src/app/admin/posts/[id]/edit/page.tsx` + `EditPostForm.tsx`
  - Save gọi `PATCH /api/admin/posts/:id`

### 1.7 UX nâng cấp (reader experience)

- Typography plugin: `@tailwindcss/typography`
  - File config: `tailwind.config.ts`
- Code block:
  - Component copy button: `src/components/CodeBlock.tsx`
- Thêm thumbnail hiển thị ở list/home + header bài viết.

> Ghi chú quan trọng: đã thử `rehype-pretty-code`/Shiki để highlight code nhưng gặp lỗi runtime dev: **`runSync finished async`**. Do đó tạm **tắt highlight async** để ưu tiên ổn định MVP.

### 1.8 Fix lỗi thực tế khi test

**(A) Console error `<img src="">`**
- Nguyên nhân: markdown có `![]()` hoặc URL ảnh rỗng.
- Fix: sanitize `img` trong `react-markdown` renderer (public + admin preview) → nếu `src` rỗng thì không render.

**(B) Publish xong bấm xem bị crash**
- Nguyên nhân: plugin highlight async.
- Fix: bỏ plugin highlight async khỏi `react-markdown`.

**(C) “Không publish được / chờ lâu mới thấy”**
- Fix: revalidate ngay sau create/update/delete:
  - `src/app/api/posts/route.ts` (POST) dùng `revalidatePath('/', '/blog', '/blog/<slug>')`
  - `src/app/api/admin/posts/[id]/route.ts` (PATCH/DELETE) revalidate tương tự.

**(D) Không add ảnh khi edit**
- Fix: thêm endpoint upload + wiring editor:
  - `src/app/api/uploads/route.ts` (upload image → lưu `public/uploads/`)
  - `onImageUpload` trong editor create/edit.

---

## 2) Cấu trúc thư mục (tóm tắt)

```txt
src/
├── app/
│   ├── api/
│   │   ├── admin/posts/...
│   │   ├── posts/...
│   │   ├── uploads/route.ts
│   │   └── grades/route.ts
│   ├── admin/posts/...
│   ├── blog/...
│   ├── login/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── CodeBlock.tsx
├── lib/
│   ├── dbConnect.ts
│   └── auth.ts (scaffold)
├── models/
│   ├── Post.ts
│   ├── Grade.ts
│   └── User.ts
├── services/
│   ├── postService.ts
│   └── gradeService.ts
├── types/
│   ├── post.ts
│   ├── grade.ts
│   └── user.ts
└── utils/
    ├── slugify.ts
    ├── formatDate.ts
    └── ...
```

---

## 3) API Routes (hiện tại)

### Public

- `GET /api/posts?page=1&limit=9&tag=...` → list bài **published**
- `GET /api/posts/:slug` → detail bài **published**
- `POST /api/posts` → tạo bài (admin-only)

### Admin (admin-only)

- `GET /api/admin/posts?page=1&limit=20&published=all|true|false` → list draft/published
- `GET /api/admin/posts/:id` → detail (bao gồm draft)
- `PATCH /api/admin/posts/:id` → update (title/slug/summary/content/tags/thumbnailUrl/isPublished)
- `DELETE /api/admin/posts/:id`

### Uploads

- `POST /api/uploads` (multipart/form-data)
  - Field: `file` (image)
  - Lưu: `public/uploads/<generated>`
  - Trả về: `{ url: "/uploads/..." }`

---

## 4) Pages & Điều hướng (UI)

### Public

- Home: `/`
  - Link: `/blog`
- Blog list: `/blog`
  - Có filter tags + pagination
  - Nếu chưa có bài → có CTA “+ Tạo bài đầu tiên”
- Blog detail: `/blog/:slug`
  - Markdown render
  - Code block có copy button
  - Related posts (theo tags)

### Admin

- `/admin/posts` (danh sách + filter)
- `/admin/posts/create`
- `/admin/posts/:id/edit`

### Auth

- `/login` (Sign in with Google)
- `/dashboard` (sinh viên)

> Navbar hiển thị trạng thái đăng nhập + avatar dropdown:
> - Chưa login: nút **Đăng nhập**
> - Đã login: Avatar → menu **Dashboard**, **Admin Portal** (chỉ admin), **Đăng xuất**

---

## 5) Hướng dẫn test (end-to-end)

### 5.1 Chạy project

```bash
cd "/Users/duykhanh/Documents/Website /my-teaching-platform"
npm run dev
```

Mở: `http://localhost:3000`

### 5.2 Tạo bài mới

1. Vào `/admin/posts/create`
2. Điền Title + Summary + Content
3. (Tuỳ chọn) Tags, Thumbnail URL
4. Tick `Publish` nếu muốn bài hiện public
5. Bấm **Lưu**

### 5.3 Publish sau khi tạo (nếu draft)

1. Vào `/admin/posts`
2. Bấm **Sửa** bài draft
3. Tick Publish → **Lưu thay đổi**
4. Mở `/blog` và `/blog/:slug` để kiểm tra

### 5.4 Test ảnh trong bài

- Trong editor, bấm icon Image và chọn file → hệ thống upload và chèn URL `/uploads/...`
- Đảm bảo bài publish rồi mở public để kiểm tra ảnh render.

### 5.5 Related posts

- Tạo ít nhất 2 bài published có chung `tags`.
- Mở detail 1 bài → section “Bài viết liên quan” sẽ hiện.

### 5.6 Xoá bài

- `/admin/posts` → bấm **Xoá** → confirm

### 5.7 Test Auth + RBAC (Phase 2)

1. Vào `/login` → bấm **Sign in with Google**
2. Đăng nhập bằng email đúng với `ADMIN_EMAIL` → vào được `/admin/posts`
3. Đăng nhập bằng email khác → gõ URL `/admin/posts` → bị redirect sang `/dashboard`
4. MongoDB Compass: thấy collections do adapter tạo (ví dụ: `users`, `accounts`, `sessions`, `verification_tokens`)

---

## 6) Quyết định kỹ thuật (Design Decisions)

- **Layered architecture**: route handlers mỏng, logic ở service, schema ở model.
- Public blog chỉ show `isPublished: true`.
- Phase 2: dùng **JWT session** để middleware đọc `role` trực tiếp trong cookie (không query DB khi route-guard).
- Adapter dùng **MongoClient riêng** (`src/lib/mongodbClient.ts`) tách khỏi Mongoose pool để tránh conflict.
- Tạm bỏ **code highlighting async** để tránh crash runtime; giữ UX copy code.
- Ảnh trong markdown được sanitize để tránh `<img src="">`.

---

## 7) Known Issues / TODO

- Hardening cho production:
  - Rotate secrets, set OAuth consent screen chuẩn, và cấu hình domain/redirect cho môi trường deploy.
  - Xem xét rate-limit cho `/api/uploads` và các endpoints admin.
- Upload hiện lưu vào `public/uploads` (đơn giản cho local); production nên chuyển sang S3/R2.

---

## 8) Phase 15G — Session G (15/02/2026)

### 8.1 Dashboard Redesign + Login Streak
- Tạo `LoginStreak` model, `streakService`, `/api/streak` endpoint
- Tạo `StreakFire` component với 6 SVG fire tiers tiến hóa theo streak + CSS animations
- Dashboard rewrite hoàn toàn: Hero, Stats+Streak, Quick Actions, Progress, Recent Sets, Heatmap, Account

### 8.2 Icon Overhaul
- Thay tất cả emoji across 10+ files bằng custom gradient SVG icons

### 8.3 Blog Editor → Tiptap WYSIWYG
- Thay `react-markdown-editor-lite` bằng **Tiptap v3.19.0** full WYSIWYG
- Extensions: StarterKit, Image, Link, Placeholder, Underline, TextAlign, Highlight, CodeBlockLowlight, TextStyle, Color, Youtube, Table, Superscript, Subscript
- Fix Tiptap v3 imports (BubbleMenu removed, TextStyle/Table named imports)
- Fix SSR hydration error (`immediatelyRender: false`)
- Fix blog editor ↔ published mismatch (thêm `tiptap-content` class)
- Thêm nút justify/right alignment
- CSS cho empty paragraph preservation, text alignment support

### 8.4 Package Audit & Cleanup
- Xóa: `react-hook-form`, `confetti-js`, `rehype-pretty-code`, `shiki`
- Update: `react 19.2.4`, `csv-parse 6.1.0`, `@types/node 25.x`
- Downgrade ESLint 10→9 (incompatible với `eslint-config-next`)

### 8.5 Mongoose Deprecation Fix
- `{ new: true }` → `{ returnDocument: 'after' }` across 8+ files (Mongoose 9.x)

### 8.6 Comprehensive Code Audit
- **ESLint: 0 errors, 0 warnings** (toàn bộ `src/`)
- **TypeScript: 0 errors** (`tsc --noEmit`)
- **Build: 0 errors** (`next build`)
- Fixes:
  - Xóa unused `title` state từ 4 vocabulary practice pages
  - Convert `ResultIcon` component-in-render → JSX variable (MCQ + fill-blank)
  - Move `handleNext`/`handleCheck`/`startGame` trước declaration để fix use-before-declaration
  - Move `statsReportedRef` access từ render body → `useEffect` (4 pages)
  - Xóa unused `allTerms` prop từ 4 `CompletionScreen` components
  - Fix `initialUnitId` missing useEffect dependency (admin/lessons/create)
  - Xóa unused `_courseId` param (LessonNavigation)
  - Convert `startGame` function → `useCallback` (matching page)
  - ESLint-disable cho 3 legitimate SSR patterns (Navbar/ShareBar/ThemeToggle)

---

## 10) Personality Test — Results Dashboard UI/UX Overhaul

**Date**: Phase 9  
**Scope**: Complete rewrite of `PersonalityResultsDashboard.tsx` with modular architecture, bilingual support, and professional UX.

### Changes Made

#### New Files Created:
- **`src/components/personality-test/i18n.ts`** — Full bilingual UI string system (EN/VI)
  - `Lang` type (`"en"` | `"vi"`)
  - `DOMAIN_EN` / `DOMAIN_VI` — domain label maps for all 8 traits
  - `TIER_EN` / `TIER_VI` — 5-tier label maps
  - `UiStrings` interface (~70+ keys), `UI_EN` / `UI_VI` implementations
  - Helper functions: `getStrings(lang)`, `getDomainLabel(domain, lang)`, `getTierLabel(tier, lang)`

- **`src/components/personality-test/traitInsights.ts`** — Bilingual trait insight content
  - `TraitInsightContent` interface (icon, what, 5 tier interpretations, career, academic, obLesson, tip, derailment?)
  - `getTraitInsight(domain, lang)` — 8 domains × 2 languages = 16 insight objects

#### Rewritten:
- **`src/components/personality-test/PersonalityResultsDashboard.tsx`** (1181→1559 lines)
  - **Architecture**: Monolithic → modular with 13+ sub-components
  - **Language**: Vietnamese-only → English default with floating 🇻🇳/🇬🇧 toggle button
  - **Percentile UX**: Dim text → animated gradient bar with P-number inside, Z-score badge with color-coded tier
  - **Expand signals**: Invisible → pulsing "✨ Tap to explore" button with animated chevron
  - **Tier system**: 5-tier z-score classification with emoji + color-coded badges (ring, badge, emoji per tier)
  - **Attention check handling**: Fixed logic — attention failures with computed scores now show results + warning banner instead of just InvalidResultCard

#### Bug Fixes:
- **Critical**: Default reference group IDs were `"soto_2017_internet"` / `"jones_2014_mturk"` (nonexistent) → corrected to `"bfi2-internet"` / `"sd3-community"` (matching `normativeData.ts` REFERENCE_GROUPS)
- **Attention warning logic**: `isValid === true && invalidReason?.includes("attention")` (never true) → `isValid === false && hasComputedScores && !!invalidReason` (correct)

#### Component Inventory:
| Component | Purpose |
|-----------|---------|
| `getZTier()` | Map z-score → 5-tier level |
| `TIER_COLORS` | Color/emoji config per tier |
| `LangToggle` | Fixed floating EN/VI toggle (top-right) |
| `RadarChart` | SVG spider chart (OCEAN only) |
| `PercentileGauge` | Animated gradient bar + P-number + Z-badge + mean marker |
| `TraitCard` | Expandable card with tier badge, score bar, insights |
| `ArchetypeCard` | Gradient hero card with strengths/blindspots |
| `InvalidResultCard` | Error state with retake CTA |
| `RefGroupSelector` | Radio-style reference group picker |
| `generateCrossTraitInsights()` | Score-based pattern detection (8 patterns) |
| `LimitationsSection` | Collapsible scientific limitations |
| `ResultsInterstitial` | Mandatory gate with checkbox |
| `ScoreTable` | Full data table (all 8 traits) |

### Verification:
- TypeScript: 0 errors (`npx tsc --noEmit`)
- Tests: 109/109 passing (`npx vitest run`)
- Build: Successful (`npx next build`)

---

## 11) Personality Test — Modularization (Phase 10)

**Scope**: Split all 4 largest files into clean module directories for maintainability.

### Files split:

| Original file | Lines | Split into | Files |
|---------------|-------|-----------|-------|
| `personalityScoring.ts` | 760 | `src/lib/personality/` | 8 files |
| `normativeData.ts` | 581 | `src/lib/normative/` | 4 files |
| `PersonalityResultsDashboard.tsx` | 1,559 | `src/components/personality-test/dashboard/` | 10 files |
| `PersonalityTestWizard.tsx` | 873 | `src/components/personality-test/wizard/` | 10 files |

- Barrel re-export files maintain backward compatibility
- All original imports continue to work unchanged
- Documentation: `docs/PERSONALITY_TEST_ARCHITECTURE.md`

### Verification:
- TypeScript: 0 errors
- Tests: 109/109 passing

---

## 12) Personality Test — Final Deep Audit (Phase 11)

**Scope**: Production-readiness audit — every file, every import, every edge case.

### Issues found & fixed:

1. **CRITICAL — Broken Percentile Comparison Section**
   - **File**: `PersonalityResultsDashboard.tsx` lines 420-434
   - **Problem**: The percentile comparison section rendered domain labels but had only a comment placeholder where PercentileGauge bars should render. `PercentileGauge` was trapped as a private function inside `TraitCard.tsx`.
   - **Fix**: Extracted `PercentileGauge` into standalone `dashboard/PercentileGauge.tsx`, exported from barrel, imported by both `TraitCard.tsx` and `PersonalityResultsDashboard.tsx`.

2. **MINOR — Wizard indentation**
   - **File**: `PersonalityTestWizard.tsx` lines 88-95
   - **Problem**: `localStorage.setItem` JSON object properties had broken (flush-left) indentation from heredoc creation.
   - **Fix**: Corrected indentation to match surrounding code.

### Files modified:
- `src/components/personality-test/dashboard/PercentileGauge.tsx` ← NEW (100 lines)
- `src/components/personality-test/dashboard/TraitCard.tsx` — imports from PercentileGauge instead of internal copy
- `src/components/personality-test/dashboard/index.ts` — added PercentileGauge export
- `src/components/personality-test/PersonalityResultsDashboard.tsx` — uses PercentileGauge in comparison section
- `src/components/personality-test/PersonalityTestWizard.tsx` — indentation fix
- `docs/PERSONALITY_TEST_ARCHITECTURE.md` — updated module map

### Verification:
- TypeScript: 0 errors (`npx tsc --noEmit`)
- Tests: 109/109 passing (`npx vitest run`)
- All import/export chains verified consistent across 51+ files

---

## 9) File thay đổi quan trọng (quick index)

- Blog public: `src/app/blog/page.tsx`, `src/app/blog/[slug]/page.tsx`
- Admin: `src/app/admin/posts/page.tsx`, `src/app/admin/posts/create/page.tsx`, `src/app/admin/posts/[id]/edit/*`
- APIs: `src/app/api/posts/*`, `src/app/api/admin/posts/*`, `src/app/api/uploads/route.ts`
- Auth: `src/lib/auth.ts`, `src/lib/mongodbClient.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/middleware.ts`, `src/types/next-auth.d.ts`
- UI Auth/Navbar: `src/components/Navbar.tsx`, `src/components/Providers.tsx`, `src/app/login/*`, `src/app/dashboard/page.tsx`, `src/app/layout.tsx`
- DB: `src/lib/dbConnect.ts`, `src/models/Post.ts`
- Services: `src/services/postService.ts`
- Tailwind typography: `tailwind.config.ts`
