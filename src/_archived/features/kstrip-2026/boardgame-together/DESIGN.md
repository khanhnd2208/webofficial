# K'sTrip Design System — Covert Expedition

> Hub du lịch & giải trí. Mỗi ván game là một **điệp vụ trong chuyến đi**.

## Cảm giác sản phẩm

- **Trustworthy** — mọi trạng thái rõ ràng, không bỏ quên edge case
- **Playful-secretive** — game suy luận có không khí hồ sơ mật, không quá nghiêm trọng
- **Warm-editorial** — giấy kraft, mực in, boarding pass
- **Precise** — hierarchy, spacing, alignment chặt
- **Tactile** — nút, thẻ, con dấu có phản hồi

## Nguyên tắc không được vi phạm

1. Dùng **semantic tokens** (`bg-accent`, `text-foreground`) — không `bg-red-600`, `bg-emerald-600`
2. Mọi component phải có đủ states: default, hover, focus, active, disabled, loading
3. Motion có mục đích — không decoration vô nghĩa
4. Tôn trọng `prefers-reduced-motion`
5. Không đổi business logic game khi chỉnh UI
6. Không thêm dependency UI nặng không cần thiết

## Stack UI

- Next.js 16 App Router
- Tailwind CSS v4 (`@theme inline` trong `globals.css`)
- Fonts: Inter (body), Space Grotesk (display), JetBrains Mono (codes/timers)
- Primitives: `src/components/ui/`

## File cần đọc

| Công việc | Đọc |
|-----------|-----|
| Token / màu / spacing | `docs/design/FOUNDATIONS.md`, `src/app/globals.css` |
| Component | `docs/design/COMPONENT_STANDARDS.md`, `src/components/ui/` |
| Motion | `docs/design/MOTION_SYSTEM.md` |
| States / copy | `docs/design/UX_PATTERNS.md` |
| Luồng game Spy | `docs/ux/FLOWS/spy-golden-flow.md` |
| QA component | `/dev/ui` |

## Quy trình thay đổi UI

1. Đọc spec liên quan
2. Kiểm tra primitive có sẵn trong `src/components/ui/`
3. Implement — không tự sáng tạo màu/spacing mới
4. Kiểm tra light + dark + mobile + reduced-motion
5. Chạy `npm run typecheck` và `npm run test:unit`
