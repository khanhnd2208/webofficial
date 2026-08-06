# Golden Flow — AI Là Gián Điệp

## Entry

`/` → Amazing Boardgames → `/games/spy` → create/join → `/games/spy/room/{code}`

## Main path

1. **Menu** — nhập tên → Tạo phòng / Tham gia mã / Phòng công khai
2. **Join gate** — xác nhận tên nếu chưa có token
3. **Lobby** — QR + mã, ready, host start (≥4 người, all ready)
4. **Role reveal** — giữ để xem hồ sơ mật → "Đã ghi nhớ"
5. **Opening** — mỗi người "Đã nói" một câu
6. **Discussion** — đánh dấu nghi ngờ công khai; host kết thúc thảo luận khi sẵn sàng
7. **Vote** — chọn nghi phạm → xác nhận; host mở phiếu
8. **Runoff** (if tie) — chọn trong nhóm hòa; host chốt
9. **Mr. White guess** (if applicable) — host xác nhận đúng/sai
10. **Result** — báo cáo giải mật, vai trò lộ; host bấm **Chơi lại** về lobby

## Error paths

- Invalid code → stay on join, show error
- Network fail → banner + retry on poll
- Session expired → re-join with name
- Host leaves → show message (existing server behavior)

## Success signal

Result screen with winner side + confetti. CTA: return to lobby for next round (host).
