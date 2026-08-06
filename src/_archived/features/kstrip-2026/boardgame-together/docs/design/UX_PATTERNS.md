# UX Patterns — Microcopy & States

## Tone (Tiếng Việt)

- Ngắn, rõ, thân thiện
- Nút bắt đầu bằng động từ: "Tạo phòng", "Tham gia", "Xác nhận"
- Lỗi: nói chuyện gì xảy ra + cách khắc phục
- Không đổ lỗi người dùng

## State matrix (game)

| State | Copy pattern |
|-------|--------------|
| Loading | "Đang kết nối điệp vụ…" + skeleton |
| Empty public rooms | "Chưa có phòng công khai — tạo phòng và mời bạn bè" |
| Join error | "Không vào được phòng: {reason}. Thử lại hoặc kiểm tra mã." |
| Offline | "Mất kết nối. Đang thử kết nối lại…" |
| Room full | "Phòng đã đủ người. Tìm phòng khác hoặc tạo mới." |
| Waiting others | "Đã xác nhận — chờ đồng đội…" |
| Success vote | Inline confirmation, no modal |

## Covert Expedition labels

See `lib/spy/i18n.ts` — `PHASE_LABELS`, `PHASE_HINTS`, `GUIDE_SECTIONS`.
