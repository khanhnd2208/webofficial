# Product Direction

## Primary purpose

**Duy Khánh — The Explorer Teacher** is a personal public journey: minimal, emotional, and service-led. The public site is not a multi-track marketplace.

### Public marketing (primary nav)

1. **Trang chủ** — `/`
2. **Tôi & Dịch vụ** — `/gioi-thieu` (three services; AI is cross-cutting)
3. **Bài viết** — `/bai-viet` (Mongo journal; HANOICAM remains editorial brand)
4. **Phát triển bản thân** — `/phat-trien-ban-than` (podcast; published only with real episodes)
5. **CTA Kết nối** — `/lien-he` (utility; not counted in the four nav items)

### Utility / archived (not primary nav)

- Policies under `/chinh-sach/*`
- `/archive` (noindex) for retired public surfaces
- Learner account `/tai-khoan/hoc` and course/lesson routes under `/hoc/khoa-hoc/*`
- Admin, API, `/m/[slug]` remain operational but outside marketing chrome

### Three services

1. Giảng dạy & workshop
2. Thiết kế chương trình học
3. Tư vấn phát triển con người & tổ chức (mentoring + business advisory as contexts)

## Access policy

- The owner is the sole author and administrator.
- Public visitors see only `published` marketing and journal routes.
- Signed-in learners only see courses with an `ACTIVE` enrollment.
- Draft routes return 404/noindex — never empty shells in navigation.
- No invented testimonials, milestones, or podcast episodes.

## Current decisions

- Vietnamese is the default for marketing; journal posts may stay bilingual.
- Service pages never publish prices; cost is proposed after clarifying need.
- Light-only public theme; Cormorant Garamond + Inter only.
- Teaching domain uses PostgreSQL + Prisma; MongoDB remains for auth, posts, profile, messages, streak, and inquiries.
- No marketplace, payment, community, membership, chatbot, or service CMS in this program.

## Product rule

Every new public feature must belong to the Explorer Teacher journey (or to system/auth/admin/learning). If its audience, ownership, and publication model are unclear, it stays `draft`.
