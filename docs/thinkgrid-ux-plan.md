# ThinkGrid — Kế hoạch UI/UX (hoàn thiện cao nhất)

**Phiên bản:** 1.0 — 2026-05-25  
**Liên quan:** [`thinkgrid-technical-spec.md`](./thinkgrid-technical-spec.md) §8.3 · [`thinkgrid-production-checklist.md`](./thinkgrid-production-checklist.md)

## Mục tiêu UX

ThinkGrid không phải Sudoku. UI phải đồng thời:

1. **Dạy luật** (segment, tường, `min(H,V)`)
2. **Giảm cảm giác bấm không được** (hint có lý do)
3. **Cho thấy đang suy luận đúng** (highlight đoạn, conflict, domain)

> Logic game **~8.5/10** · UI/UX sau P0 ship **~8/10** · E2E vẫn backlog

---

## Đánh giá tạm (reviewer)

| Hạng mục | Điểm | Ghi chú |
|----------|------|---------|
| Visual branding | 7/10 | Board cần nổi bật hơn sidebar |
| Learnability | 5.5→8 | How-to-play modal (P0) |
| Input UX | 7.5/10 | Pad, hint, undo, notes |
| Feedback khi sai | 7→8 | `describeIllegalUserMove` + conflict copy |
| Mobile | TBD | Sticky pad, tab sidebar |
| Daily habit | 6.5→8 | Solved modal + share |
| Production confidence | 6.5 | E2E backlog |

---

## P0 — Trước public beta (**đã ship 2026-05-25**)

| ☑ | Hạng mục | File / ghi chú |
|---|----------|----------------|
| ☑ | How-to-play modal 4 bước | `HowToPlayModal.tsx` |
| ☑ | Tường dày hơn grid | `PuzzleCell.tsx`, `PuzzleBoard.tsx` |
| ☑ | Selected ≠ error (sky vs red) | `PuzzleCell.tsx` |
| ☑ | Idle overlay + Start gần board | `PuzzleGame.tsx` |
| ☑ | Hint lý do cụ thể | `describeIllegalUserMove` |
| ☑ | Domain hint «Có thể: …» | `CellDomainHint.tsx` |
| ☑ | Nút Hoàn tác (mobile) | `NumberPad.tsx` |
| ☑ | Submit: còn N ô / conflict | `PuzzleGame` + session |
| ☑ | Solved modal time/streak/share | `PuzzleSolvedModal.tsx` |
| ☑ | Mobile sticky pad | `PuzzleGame.tsx` |
| ☑ | Lỗi Start thân thiện | `startErrorMessage.ts` |
| ☑ | Microcopy tiếng Việt | `PuzzleGame` header |

## P1 — Polish

| ☐ | Hạng mục |
|---|----------|
| ☑ | Highlight segment H/V rõ hơn |
| ☑ | Notes mode label «Đang ghi chú» |
| ☑ | Autosave: Đang lưu / Đã lưu |
| ☑ | Arrow keys di chuyển ô |
| ☑ | Phím `N` bật notes · `Esc` đóng modal |
| ☑ | Conflict icon `!` trên ô |
| ☑ | Leaderboard highlight user row | `PuzzleLeaderboard.tsx` |

## Catalog & validator v1.7 (2026-05-25)

| ☑ | Hạng mục |
|---|----------|
| ☑ | Thư viện `/puzzle` — chọn câu, không khóa 1/ngày |
| ☑ | Nút nổi bật **8×8** + badge kích thước |
| ☑ | Empty state + `npm run db:puzzle:reset` |
| ☑ | `GET /api/puzzle/health` — readiness |
| ☑ | Runtime guard khi **chơi** (catalog nhẹ, không chạy solver/list) |

**Dev setup:** `npm run db:puzzle:reset` → mở `/puzzle`.

## P2 — Nice to have

- Playwright E2E (wall render + catalog)
- Wall-first generator Mức 3
- Archive / practice mode
- Animation solved, sound/haptic

---

## E2E roadmap (Playwright)

1. Load today → idle hint  
2. Start → pad visible  
3. Legal/illegal input + hint  
4. Notes persist refresh  
5. Erase / undo  
6. Submit incomplete (no mistake++)  
7. Submit solved → modal  
8. Wall visual = compiler  

---

## Layout khuyến nghị

**Desktop:** Board + pad trung tâm; stats/leaderboard sidebar phải. Board `min(72vh, 560px)`.

**Mobile:** Tab `Chơi | Xếp hạng | Thống kê`; pad sticky đáy; touch ≥44px.

---

*Cập nhật checklist khi ship từng mục.*
