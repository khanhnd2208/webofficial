# Route Map — The Explorer Teacher

Single source of truth: `src/config/routes.ts`, `src/config/navigation.ts`, `src/config/site.ts`, `src/content/*`.

Navigation and footer render **only** links with `status: 'published'`.

## Brand hierarchy

| Brand | Role |
|-------|------|
| **Duy Khánh** | Master brand / site wordmark |
| **The Explorer Teacher** | Positioning line |
| **HANOICAM** | Editorial journal brand |
| **NDK** | Personal mark / signature |

## Public marketing

| Path | Purpose | Status |
|------|---------|--------|
| `/` | Homepage journey | Published |
| `/gioi-thieu` | Tôi & Dịch vụ (3 services + process) | Published |
| `/bai-viet` | Writing / journal | Published |
| `/phat-trien-ban-than` | Podcast / growth | Draft until real episode |
| `/lien-he` | Kết nối (inquiry) | Published (prod needs Resend) |
| `/chinh-sach/[slug]` | Policies | Published |
| `/archive` | Retired public surfaces | Published + **noindex** |

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
