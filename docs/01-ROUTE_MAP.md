# Route Map — HANOICAM

Single source of truth in code: `src/config/routes.ts`, `src/config/navigation.ts`.

## Public

| Path | Purpose |
|------|---------|
| `/` | Personal brand landing |
| `/bai-viet` | Post list |
| `/bai-viet/[slug]` | Post detail |
| `/giang-day` | Teaching intro |
| `/gioi-thieu` | About / contact |
| `/dang-nhap` | Sign in |
| `/m/[slug]` | Public message recipient view |

## Learner

| Path | Purpose |
|------|---------|
| `/hoc` | Learner dashboard |
| `/hoc/khoa-hoc/[slug]` | Course overview (Phase 3) |
| `/hoc/khoa-hoc/[slug]/bai/[lessonSlug]` | Lesson + progress (Phase 3) |
| `/tai-khoan` | User profile |

## Admin

| Path | Purpose |
|------|---------|
| `/admin` | Overview |
| `/admin/posts`, `/admin/posts/create` | Posts |
| `/admin/courses`, `/admin/enrollments` | Teaching (Phase 2+) |
| `/admin/tools/*` | Vocabulary, Lucky Card, Messages |
| `/admin/users`, `/admin/media`, `/admin/settings` | System |

## Permanent redirects

| From | To |
|------|----|
| `/blog`, `/blog/*` | `/bai-viet`, `/bai-viet/*` |
| `/login` | `/dang-nhap` |
| `/dashboard` | `/hoc` |
| `/profile` | `/tai-khoan` |
| `/admin/vocabulary` | `/admin/tools/vocabulary` |

Public navigation: Trang chủ · Bài viết · Giảng dạy · Đăng nhập/Tài khoản.  
Tools, Vocabulary, and Admin are never in the public header.

Vocabulary pages under `/vocabulary/*` and related APIs are **admin-only** (tool isolation).
