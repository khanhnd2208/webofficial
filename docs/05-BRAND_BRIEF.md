# Brand Brief — Duy Khánh

**Status:** Owner-approved structure · contact/social fields optional until provided  
**Last updated:** 2026-07-16

## Master brand

| Element | Value |
|---------|--------|
| Display name | **Duy Khánh** |
| Eyebrow | Duy Khánh · Giảng viên |
| Editorial brand | **HANOICAM** (Journal only) |
| Personal mark | **NDK** (signature, not product brand) |

## Positioning

Website cá nhân của một giảng viên — nơi Duy Khánh giới thiệu công việc giảng dạy, chia sẻ những điều đang học và lưu lại suy nghĩ về con người, công việc, cuộc sống.

## Lời giới thiệu cốt lõi

Không chỉ học để biết. Học để trở thành. Kiến thức cần gặp thực tế, trải nghiệm cần được nhìn lại và việc học cần tạo ra thay đổi.

## Tone

Trầm, rõ ràng, biên tập — canvas giấy / ink / vermilion. Không marketplace, không bảng giá công khai, không “AI glow”.

## Hành trình đọc

1. **Làm quen** — Trang chủ → Giới thiệu
2. **Ở lại đọc** — Trang chủ / Giới thiệu → Bài viết
3. **Gửi lời nhắn khi cần** — mọi trang → `/lien-he`

## Bio pack

| Length | Copy |
|--------|------|
| ~50 | Duy Khánh — giảng viên, người thiết kế chương trình học và người viết. |
| ~150 | `siteProfile.shortBio` trong `src/config/site.ts` |
| Dài | `aboutContent` trong `src/content/about.ts` |

## Contact / media (owner fill)

| Field | Status |
|-------|--------|
| Public email | **missing** — set `siteProfile.contactEmail` |
| LinkedIn / social | **missing** — set `siteProfile.socialLinks` |
| Portrait photo | **draft** — currently hero illustration `/brand/hero-journey.jpg` |
| Hero illustration | **ready** |

## Publication gates

Defined in `docs/00-PRODUCT_DIRECTION.md` and enforced via `status: draft \| published` in `src/content/*` and `src/config/navigation.ts`.
