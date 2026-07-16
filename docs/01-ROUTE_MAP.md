# Bản đồ đường dẫn — Duy Khánh

Single source of truth: `src/config/routes.ts`, `src/config/navigation.ts`, `src/config/site.ts`, `src/content/*`.

Navigation and footer render **only** links with `status: 'published'`.

## Brand hierarchy

| Brand | Role |
|-------|------|
| **Duy Khánh** | Master brand / site wordmark |
| **Việc học thay đổi cách ta nhìn và cách ta làm.** | Quan niệm giáo dục |
| **HANOICAM** | Editorial journal brand |
| **NDK** | Personal mark / signature |

## Public marketing

| Path | Purpose | Status |
|------|---------|--------|
| `/` | Trang chủ | Published |
| `/gioi-thieu` | Giới thiệu con người, công việc và cách nghĩ về dạy học | Published |
| `/bai-viet` | Bài viết và ghi chép | Published |
| `/phat-trien-ban-than` | Podcast | Draft until real episode |
| `/lien-he` | Gửi lời nhắn | Published (prod needs Resend) |
| `/chinh-sach/[slug]` | Policies | Published |
| `/archive` | Lưu trữ nội dung và công cụ cũ | Published + **noindex** |

## Redirects (retired marketing)

| From | To |
|------|----|
| `/dong-hanh`, `/dong-hanh/ai-ung-dung` | `/gioi-thieu?section=dich-vu` |
| Mentoring / business advisory | `/gioi-thieu?section=tu-van-phat-trien` |
| Training workshop / `/giang-day` | `/gioi-thieu?section=giang-day-workshop` |
| `/case-study` | `/gioi-thieu?section=dau-moc` |
| `/goc-cua-khanh`, `/hoc`, `/hoc/chuong-trinh` | `/archive` |

Lab resource detail URLs remain reachable (noindex). Learner routes `/hoc/khoa-hoc/*` and `/tai-khoan/hoc` are unchanged.

## Learning & system

| Path | Purpose |
|------|---------|
| `/tai-khoan/hoc` | Learner hub |
| `/hoc/khoa-hoc/[slug]` | Course (enrolled / public intro) |
| `/m/[slug]` | Public message recipient |
| `/admin/*` | Admin (not in marketing chrome) |
