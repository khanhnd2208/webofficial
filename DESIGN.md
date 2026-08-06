# DESIGN.md — Duy Khánh (toiladuykhanh.com)

> Open design-system brief for UI/UX re-architecture of the public personal portfolio.
> Status: derived from owner-approved brand brief + live product direction (2026-08).
> Language: Vietnamese-first public surface; English for track labels and some project titles.

---

## 1. Product & purpose

**Product:** Personal education portfolio of **Nguyễn Duy Khánh** (public brand: **Duy Khánh**).

**Public purpose:** A first-time visitor should understand who he is, what he does, what he has built, how he can help, and how to start a conversation.

**Central promise:**
> Biến kiến thức phức tạp thành năng lực, chương trình và quy trình có thể áp dụng.

**Public promise (spoken voice):**
> Tôi giúp người học và tổ chức biến kiến thức quản trị và AI thành năng lực, chương trình và quy trình có thể áp dụng.

**Core principle:** Hiểu đúng vấn đề trước khi tìm giải pháp.

**Three pillars:**
1. Management Education
2. Learning Design
3. Applied AI

**Not this product:** SaaS landing page, agency site, dark neon AI product, blog-first media brand, or login-gated public chrome.

---

## 2. Brand identity

| Token | Value |
|-------|-------|
| Master brand / wordmark | Duy Khánh |
| Full public name | Nguyễn Duy Khánh |
| Personal mark | NDK |
| Editorial journal name (not wordmark) | HANOICAM |
| Positioning line | Tôi dạy, học và viết từ Hà Nội. |
| Eyebrow / tracks | Management Education · Learning Design · Applied AI |
| Meta title | Duy Khánh — Giảng viên và người thiết kế trải nghiệm học tập |
| Site description | Duy Khánh là giảng viên và người thiết kế trải nghiệm học tập tại Hà Nội. Anh dạy quản trị, nghiên cứu AI trong công việc và lưu lại những điều học được trên hành trình ấy. |
| Credentials | Giảng viên, Khoa Quản trị Kinh doanh và Du lịch · Trường Đại học Hà Nội · Hà Nội, Việt Nam |
| Production URL | https://toiladuykhanh.com |

### Voice

- Calm, specific, sincere, evidence-aware
- First person Vietnamese (`Tôi…`)
- Prefer concrete teaching/learning context over generic leadership speak
- Never invent numbers, testimonials, emails, social links, or outcomes
- Avoid sales-heavy CTAs; contact starts as a conversation, not a pitch

### Signature copy (keep or refine, do not invent replacements without owner)

- Manifesto / About H1: `Tôi vẫn đang học cách trở thành một người thầy tốt hơn.`
- Thesis: `Tôi tin một lớp học tốt cần sự chính xác của học thuật, sự hữu ích của thực hành và sự chăm chút của một tác phẩm.`
- Promise line: `Tôi dạy quản trị, thiết kế chương trình học và khám phá cách AI có thể giúp con người học và làm việc tốt hơn.`
- Overlay: `Hà Nội · Lớp học · Những thử nghiệm`
- Contact title: `Gửi tôi một lời nhắn.`
- Contact CTA: `Gửi lời nhắn`
- Gate locked note: `Không gian này đang được hoàn thiện.`

---

## 3. Visual direction

**Desired feel:** Editorial · academic · human · refined · boutique library · “Explorer Teacher”.

**Atmosphere:** Warm paper, soft black ink, muted bronze accent, large whitespace, hairline rules, measure-limited prose, restrained motion. Light-only public theme.

**Composition rules:**
- One composition per viewport (not a dashboard)
- Brand / person presence must survive removing the nav
- One job per section: one headline + one short supporting sentence
- Default: no cards on marketing surfaces; hairline-border list rows preferred
- Full-bleed only when imagery is real and intentional; current home is a **typographic gate**, not a poster hero
- Imagery should show person, place, classroom, or real project artefacts — not abstract AI gradients

**Explicitly avoid:**
- Dark mode on public marketing
- Account icon / login in public nav
- Neon AI imagery, glow effects, purple-indigo gradients
- Heavy multi-layer shadows
- Fashion Didone serifs, ALL-CAPS wide tracking, oversized poster hero type
- Pill clusters, stat strips, floating badges, promo stickers on media
- Decorative icon chrome
- Unverified proof UI when data is empty (hide empty proof)

**Known tension for redesign:** Current palette (warm cream `#F8F7F4` + serif + bronze) is intentional brand, but sits near a common AI-design cluster. Redesign should either **own and deepen** this paper/bronze system with stronger real photography, or **deliberately depart** with a clearer owner-owned visual signature — do not drift into generic purple SaaS or broadsheet newspaper pastiche.

---

## 4. Color system (light public)

| Role | Token | Hex |
|------|-------|-----|
| Canvas | `--canvas` | `#F8F7F4` |
| Paper / surface | `--paper` | `#F1EFEA` |
| Ink | `--ink` | `#171717` |
| Ink secondary | `--ink-secondary` | `#595650` |
| Hairline | `--hairline` | `#D8D5CE` |
| Section tint | `--section-tint` | `#ECE8E0` |
| Accent (bronze) | `--bronze` / `--accent` | `#765625` |
| Accent hover | `--accent-hover` | `#6F482C` |
| Accent subtle | `--accent-subtle` | `#F6EEE3` |
| Sage (secondary) | `--sage` | `#879281` |
| Sunlight | `--sunlight` | `#C89D4B` |
| Success | `--success` | `#5A7A62` |
| Warning | `--warning` | `#B8892E` |
| Error | `--error` | `#A9442A` |
| Theme color | — | `#F8F7F4` |

Surfaces elevate slightly toward `#FFFCF7`; borders strengthen toward `#9E9588`. Prefer hairlines over shadows.

**Shadows (use sparingly):**
- sm: `0 1px 2px rgb(24 32 39 / 0.04)`
- md / lg exist but public marketing prefers minimal shadow

---

## 5. Typography

| Role | Family | Notes |
|------|--------|-------|
| Display / headings | **Source Serif 4** (variable, normal + italic) | Human, academic, not fashion Didone |
| Body / UI | **Inter** (latin + vietnamese) | Readable, quiet |
| Mono | SF Mono / Monaco / Consolas stack | Code / rare labels only |

**Scale guidance (strong, readable — not poster):**
- Wordmark: ~1.5–1.875rem
- Premium display / manifesto: `clamp(2.5rem, 5vw, 4.5rem)` (mobile capped ~2.5–3.125rem)
- Editorial heading: `clamp(2rem, 3.5vw, 3.25rem)`, weight 500
- Section / page title: `clamp(1.75rem, 2.5vw, 2.25rem)`
- H3: `clamp(1.375rem, 1.8vw, 1.75rem)`, weight 500
- Body: 16–17px; lead: ~17–21px; line-height ~1.7–1.8
- Editorial label: 12px, weight 600, tracking 0.04em, accent color, sentence case
- Gate nav: 13px, tracking ~0.14em

Brand is **typographic** — there is no logo SVG. Wordmark = “Duy Khánh” in Source Serif 4.

---

## 6. Layout & spacing

| Token | Value |
|-------|-------|
| Shell max | 1280px |
| Gutter | 24 → 40 → 80px |
| Section space | ~2.25–3.5rem (+ editorial clamp 3–5rem) |
| Measure | 42rem / 72ch wide |
| Radii | sm 10 · media 12 · md 14 · lg/xl 20 · full 9999 |
| Editorial buttons/links | Square-edged (no radius) |
| UI form buttons | May use rounded-full (internal forms only) |

**Grid pattern on content headers:** 12-col — copy ~7 cols + media ~5 cols (portrait 4:5 in `premium-media` frame).

**List density:** Border-stacked rows (`border-t/b` hairline), generous vertical padding, measure-constrained copy — editorial list, not card grid.

---

## 7. Information architecture (public)

| Route | Purpose |
|-------|---------|
| `/` | Gate homepage — choose destination (centered typographic menu) |
| `/gioi-thieu` | Personal story, work today, path, credentials |
| `/du-an` | Project index (list) |
| `/du-an/[slug]` | Case / inquiry deep dive |
| `/dich-vu` | Three service offers → contact with inquiry type |
| `/my-space` | Personal experiments hub (boardgames, podcast, tests) |
| `/lien-he` | Full contact form |
| `/ghi-chep` | Notes (draft / gated by published content) |
| `/chinh-sach/*` | Policies required by contact form |

**Current gate nav items:**
- Giới thiệu → `/gioi-thieu`
- Dự án → `/du-an`
- Dịch vụ → `/dich-vu`
- My Space → `/my-space` (hub open; child tiles evidence-gated / coming soon)

**Chrome model (current):**
- Classic top Navbar and footer are retired on public marketing
- Home = full-bleed gate, no back link
- Inner pages = minimal chrome: `← Trang chủ` + vertical contact rail (desktop) / contact FAB (mobile) opening a quick contact sheet
- Full contact remains on `/lien-he`

**Internal surfaces (out of scope for public redesign):** `/admin/*`, auth, account, courses, vocabulary, messages.

### Current projects
1. Strategic Management Learning Experience — `/du-an/strategic-management-learning-experience`
2. AI50 — AI cho mọi người — `/du-an/ai50-ai-cho-moi-nguoi`
3. Learning at Moonie Cafe — `/du-an/learning-at-moonie-cafe`
4. AI in Recruitment Research — `/du-an/ai-in-recruitment-research`

### Services (exact titles)
1. Giảng dạy và bổ trợ kiến thức quản trị
2. Đào tạo ứng dụng AI
3. Tư vấn và cố vấn cho doanh nghiệp

---

## 8. Interaction & motion

**Principles:** Motion creates presence and hierarchy, not noise. Respect `prefers-reduced-motion`.

**Timing:**
- Fast hover ~180ms
- UI ~220–280ms
- Gate exit ~250ms
- Section reveal ~500ms
- Hero/image ~550–1600ms
- Ease editorial: `cubic-bezier(0.22, 1, 0.36, 1)`

**Patterns to preserve or improve:**
- Gate: sibling dim on hover; exit fade + slight lift then navigate
- Editorial button: ink fill on hover, gap widen with arrow
- Text link: underline + gap widen + opacity ~0.72
- Route entrance fade on inner pages
- Service disclosure: accordion on mobile, open on desktop
- Quick contact sheet: bottom sheet mobile / right panel desktop
- Empty proof/testimonials: **do not render**

Atmosphere detail: subtle paper grain overlay (~2% opacity).

---

## 9. Component vocabulary (public)

**Chrome:** GateNav, PublicMinimalChrome (back + contact rail/FAB), MainContent, SkipLink

**Marketing:** EditorialHero, SectionHeading / Intro / Scroll, MarketingCta, Breadcrumb, ServiceDisclosure, Proof/Trust primitives (data-driven), NotePreview

**Portfolio:** ProjectList (list rows, not cards/grid), case narrative sections (question → journey → artefacts → lessons)

**Contact:** ContactForm, QuickContactPanel, ContactLink

**Motion:** RouteEntrance, HorizonReveal, SectionReveal, StaggerGroup, EditorialMedia / Cover

Prefer list + hairline + measure over card grids for projects and services.

---

## 10. Content & proof discipline

- Publish only verifiable claims
- Scope, deliverables, outcomes, and verified impact stay semantically distinct
- Missing owner fields must stay empty in UI:
  - Public email
  - LinkedIn / CV
  - Real portrait & activity photos (current illustration is temporary)
  - Real project artefacts (covers currently share placeholder portrait)
  - Approved testimonials

Do not invent placeholder testimonials, fake metrics, or social proof.

---

## 11. Assets & media inventory

**Active brand media:**
- `/brand/portrait-journey.png` — temporary journey portrait / shared placeholder
- `/og-editorial-premium.png` — social OG

**Legacy / alternate brand art (available):**
- `hero-figure.jpg`, `hero-journey.jpg`, `hero-landscape.jpg`, `hero-mobile.jpg`
- `learning-as-becoming-{desktop,tablet,mobile,mobile-480,og}.{jpg,webp,avif}`

**Missing for fidelity (owner must supply):**
- Real portrait + teaching/activity photos
- Per-project artefacts / covers
- Logo only if a non-typographic mark is desired (currently typographic)
- Approved headshot for OG if replacing illustration

**Fonts:** Google-hosted Inter + Source Serif 4 (no local font files).

---

## 12. Redesign goals (what “good” looks like)

1. Visitor immediately reads: **who** (Duy Khánh / teacher in Hà Nội), **what tracks**, **how to start a conversation**.
2. First viewport of home remains one clear composition — either a refined gate or a stronger brand-led hero that still passes the brand test without nav.
3. About / Projects / Services feel like one editorial system, not separate templates.
4. Contact stays low-friction and sincere (`Gửi tôi một lời nhắn.`).
5. Visual system feels owner-owned: paper/bronze refined with real photography, or a deliberate new signature — not generic AI SaaS.
6. Keep Vietnamese voice, evidence discipline, light-only public, and no account chrome.
7. Mobile and desktop both quiet, readable, and fast; motion restrained.
8. Preserve clear path: Gate → Giới thiệu / Dự án / Dịch vụ → Liên hệ.

---

## 13. Tech constraints (for implementers)

- Next.js App Router personal site (`khanhwebsite`)
- Public marketing is light-forced (`html.light`)
- Content sources of truth: `src/config/site.ts`, `src/content/publicMarketing.ts`, `src/content/about.ts`, `src/features/portfolio/data/projects.ts`
- Design tokens live in `src/app/globals.css` + motion in `src/components/motion/tokens.ts`
- Internal teaching platform exists but is out of public IA scope

---

## 14. Reference URLs

- Live site: https://toiladuykhanh.com
- GitHub: https://github.com/khanhnd2208/webofficial
- Owner brand brief: `docs/05-BRAND_BRIEF.md`
- Product direction: `docs/00-PRODUCT_DIRECTION.md`
