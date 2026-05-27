# ThinkGrid — Production checklist

Tài liệu vận hành bổ sung cho [`thinkgrid-technical-spec.md`](./thinkgrid-technical-spec.md) (**spec v1.6**).

**Gửi chuyên gia:** [`thinkgrid-expert-handoff.md`](./thinkgrid-expert-handoff.md) (đọc trước) → [`thinkgrid-expert-review.md`](./thinkgrid-expert-review.md).

**Cập nhật:** 2026-05-25 — đóng gói handoff; **54** puzzle tests; build OK; UX P0 ship.

---

## 1. Trạng thái production (tóm tắt)

| Giai đoạn | OK? | Điều kiện |
|-----------|-----|-----------|
| **Local / CI verify** | **Có** | `npx vitest run src/lib/puzzle` (54) + `npm run build` |
| **Staging** | **Có** | Migrate + `db:seed:puzzle:future` + smoke §6 |
| **Public beta nhỏ** | **Có thể** | Smoke + How-to-play + Start không 500 |
| **Public rộng** | **Chưa** | E2E Playwright; ≥30 puzzles; Mức 3 generator |

| Hạng mục | Điểm | Ghi chú |
|----------|------|---------|
| Engine | **8.5/10** | Segment, solver, publish gate |
| State pipeline | **8.5/10** | 3 invariant; 54 tests |
| Generation (Mức 2) | **7/10** | Shuffle, quality gate, difficulty warn |
| Player UX | **8/10** | How-to-play, pad, undo, solved modal |
| Release safety | **8/10** | Seed future; `db:puzzle:check` |
| E2E | **4/10** | Chưa Playwright |

---

## 2. Verification pass (2026-05-25)

```bash
npx vitest run src/lib/puzzle    # 54 passed (13 files)
npm run build                    # exit 0
npm run db:puzzle:check          # optional: DB local
```

| Kiểm tra | Kết quả |
|----------|---------|
| Unit tests `src/lib/puzzle` | **54/54 pass** |
| `puzzleEngine`, `solver`, `statePipeline` | Pass |
| `seedPuzzles` (7 ngày + publish gate) | Pass |
| `puzzleValidation`, `givenPicker`, `difficultyEvaluator` | Pass |
| `undoStack`, `playableStats`, `startErrorMessage` | Pass |
| Next.js production build | Pass |

**Lưu ý:** `npx vitest run` (toàn repo) có thể fail tests vocab cần `DATABASE_URL` — **không** thuộc ThinkGrid.

**Chưa tự động:** Playwright; smoke UI trên staging URL.

---

## 3. Ba invariant P0

| # | Invariant | Test |
|---|-----------|------|
| 1 | Givens không conflict | `given cells are not conflicts` |
| 2 | Autosave không xóa conflict | `sanitize keeps conflicting user values` |
| 3 | Submit overlay givens | `server submit path` |

---

## 4. Deploy (production)

```bash
npm run db:migrate:deploy
npm run db:seed:puzzle:future
npm run db:puzzle:check
```

- `THINKGRID_ALLOW_DATE_OVERRIDE` — **tắt** trên production public.
- Today (VN): `GET /api/puzzle/today` → `size: 7` cho 2026-05-25 sau seed.
- **8×8** (`2026-05-26`) cần **tường dọc + tường ngang** giữa board (4 ô 4×4); layout chỉ tường dọc bị **segment feasibility gate** reject. Chạy `db:seed:puzzle:future` sau khi đổi seed — runner so sánh `layoutJson` để thay bản stale.
- **P0 gate:** `segmentFeasibility.ts` — `caps[i] >= i+1` mỗi segment; chạy trước solver/publish.

---

## 5. Seed scripts

| Script | Hành vi |
|--------|---------|
| `npm run db:seed:puzzle` | Alias → **future** |
| `npm run db:seed:puzzle:future` | Upsert; skip có attempts; stale-replace |
| `npm run db:seed:puzzle:dev` | Wipe — `PUZZLE_SEED_CONFIRM=WipeAll` |
| `npm run db:puzzle:check` | DB vs catalog |

Seed validate: `validatePuzzleForPublish` + log difficulty score.

---

## 6. Smoke test thủ công (staging)

### 6.1 Env

```bash
THINKGRID_ALLOW_DATE_OVERRIDE=true
```

URL: `/puzzle?date=2026-05-19` … `2026-05-25`

### 6.2 Ma trận

| # | Bước | Kỳ vọng | ☐ |
|---|------|---------|---|
| 1 | Load today | 7×7 HARD | |
| 2 | **Cách chơi** modal (lần đầu) | 4 bước; đóng được | |
| 3 | Idle — click ô | Hint Start | |
| 4 | **Bắt đầu chơi** | Không 500; timer; pad | |
| 5 | Domain hint | «Có thể: …» | |
| 6 | Số hợp lệ / không hợp lệ | Hint lý do cụ thể | |
| 7 | Ghi chú + Xóa + **Hoàn tác** | | |
| 8 | Refresh | Progress còn | |
| 9 | Nộp thiếu ô | «còn N ô»; không +mistake | |
| 10 | Nộp đúng | Solved modal; share; streak | |
| 11 | Mobile | Tab Chơi/Xếp hạng; pad sticky | |
| 12 | Ctrl+Z / ⌘Z | Undo | |

### 6.3 Start — troubleshooting

| Triệu chứng | Xử lý |
|-------------|--------|
| Internal server error | `db:migrate:deploy` |
| Database schema outdated | Migrate |
| Phiên đăng nhập không hợp lệ | Login lại |
| UI 3×3 / 4×4 cũ | `db:puzzle:check` + `db:seed:puzzle:future` |

---

## 7. Catalog seed (7 ngày)

| dateKey | Size |
|---------|------|
| 2026-05-19 | 4×4 |
| 2026-05-20–24 | 5×5 / 6×6 |
| **2026-05-25** | **7×7 HARD** |
| **2026-05-26** | **8×8 HARD** — quadrants + ô đen giữa |

---

## 8. Trước public rộng

- [ ] Smoke §6 hoàn tất
- [ ] ≥30 puzzle future + playtest
- [ ] Playwright E2E (ux-plan § E2E)
- [ ] Mức 3 generator hoặc quy trình admin publish tuần
- [ ] Expert sign-off §7 (`thinkgrid-expert-review.md`)

---

## 9. Known gaps

- Playwright chưa có.
- Một số ngày seed blocked-only.
- Difficulty score chưa chặn publish.
- 7×7 seed build ~2–15s.

---

*Đồng bộ với [`thinkgrid-expert-handoff.md`](./thinkgrid-expert-handoff.md).*
