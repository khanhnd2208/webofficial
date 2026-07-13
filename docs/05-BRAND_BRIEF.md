# Brand Brief — Duy Khánh

**Status:** Owner-approved structure · contact/social fields optional until provided  
**Last updated:** 2026-07-13

## Master brand

| Element | Value |
|---------|--------|
| Display name | **Duy Khánh** |
| Eyebrow | Giảng viên · Mentor · Cố vấn |
| Editorial brand | **HANOICAM** (Journal only) |
| Personal mark | **NDK** (signature, not product brand) |

## Positioning

Personal Knowledge & Advisory Studio — đồng hành với cá nhân và tổ chức làm rõ hướng đi, học có phương pháp, và viết để hiểu sâu.

## Brand promise

Làm rõ bài toán trước khi tối ưu công cụ. Không hứa kết quả ngoài tầm kiểm soát. Không dùng bằng chứng giả.

## Tone

Trầm, rõ ràng, biên tập — canvas giấy / ink / vermilion. Không marketplace, không bảng giá công khai, không “AI glow”.

## Conversion tracks

1. **Cá nhân** — mentoring / học / Journal → `/lien-he?type=mentoring` hoặc Journal  
2. **Tổ chức** — cố vấn / đào tạo / AI → `/lien-he?type=business|training|ai`

## Bio pack

| Length | Copy |
|--------|------|
| ~50 | Duy Khánh — giảng viên, mentor và cố vấn cho cá nhân và đội ngũ trẻ. |
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
