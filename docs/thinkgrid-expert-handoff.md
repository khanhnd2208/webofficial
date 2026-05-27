# ThinkGrid — Gói tài liệu gửi chuyên gia (Expert Handoff)

**Ngày đóng gói:** 2026-05-25  
**Trạng thái:** Sẵn sàng review public beta (có kiểm soát) — **không** claim autonomous generator dài hạn.

---

## 1. Đọc theo thứ tự này

| # | File | Vai trò |
|---|------|---------|
| 1 | **[`thinkgrid-expert-review.md`](./thinkgrid-expert-review.md)** | **Entry point** — luật, pipeline, seed Mức 2, UX, câu hỏi §7, checklist §9 |
| 2 | [`thinkgrid-technical-spec.md`](./thinkgrid-technical-spec.md) | Spec kỹ thuật đầy đủ (API, DB, validation, file map) |
| 3 | [`thinkgrid-production-checklist.md`](./thinkgrid-production-checklist.md) | Deploy, smoke test, troubleshooting Start |
| 4 | [`thinkgrid-ux-plan.md`](./thinkgrid-ux-plan.md) | UI/UX P0/P1, E2E roadmap |

**Repo:** `src/lib/puzzle/*`, `src/components/puzzle/*`, `prisma/puzzle-seed-*`, `src/services/puzzleService.ts`

---

## 2. Verification đã chạy (2026-05-25)

Chạy lại trước khi gửi nếu code đổi:

```bash
npx vitest run src/lib/puzzle   # kỳ vọng: 54 passed (13 files)
npm run build                   # exit 0
npm run db:puzzle:check         # optional: DB local
```

| Kiểm tra | Kết quả ghi nhận |
|----------|------------------|
| Unit tests ThinkGrid engine | **54/54 pass** |
| Next.js production build | **OK** |
| Full repo `vitest run` | 68 pass; 12 fail vocab DB tests (cần `DATABASE_URL` — **không** thuộc ThinkGrid) |

### Phạm vi test ThinkGrid (13 files)

| File | Nội dung |
|------|----------|
| `puzzleEngine.test.ts` | Layout, segments, completion, givens |
| `solver.test.ts` | Unique / multi solution |
| `statePipeline.test.ts` | 3 invariant P0, `describeIllegalUserMove` |
| `seedPuzzles.test.ts` | 7 ngày + publish gate + quality |
| `seedShuffle.test.ts` | Deterministic shuffle |
| `givenPicker.test.ts` | Givens + seedKey bias |
| `difficultyEvaluator.test.ts` | Difficulty metrics |
| `layoutQuality.test.ts` | Quality errors + warnings |
| `puzzleValidation.test.ts` | Publish gate integration |
| `undoStack.test.ts` | Undo LIFO |
| `playableStats.test.ts` | Empty cell count |
| `startErrorMessage.test.ts` | Start API copy |
| `puzzleDateOverride.test.ts` | Staging `?date=` |

---

## 3. Tính năng đã ship (tóm tắt một trang)

### Correctness
- Segment-based rules (không Sudoku); `maxAllowedValue = min(L_H, L_V)`
- Publish: `validateFullSolution` + `countSolutions(limit=2) === 1`
- State pipeline: 3 invariant P0; submit không leak `solutionJson`
- Progress/autosave: chỉ user values; givens overlay server-side

### Generation (Mức 2)
- `pickGivensForUnique` + **deterministic shuffle** (`dateKey`)
- **Quality gate** (errors chặn publish/seed)
- **Difficulty evaluator** (score + warnings, chưa chặn cứng)

### Player UX (v1.5–1.6)
- How-to-play modal 4 bước; Cách chơi; domain hint; save badge
- Notes, Xóa, Hoàn tác (nút + Ctrl+Z); sticky pad mobile
- Solved modal; submit feedback (N ô thiếu / conflict)
- Leaderboard highlight user

### Chưa có (trước public rộng)
- Playwright E2E
- ≥30 ngày puzzle + playtest catalog
- Mức 3 generator (candidate pool + chọn best)
- Formal proof; autonomous daily generator

---

## 4. Mẫu email gửi chuyên gia

```
Kính gửi anh/chị,

Em gửi bộ review ThinkGrid (daily logic puzzle kiểu One-Up/segment-based).

Đọc trước: docs/thinkgrid-expert-handoff.md (mục lục + verification)
Chi tiết: docs/thinkgrid-expert-review.md — trả lời bảng §7 và tick §9 (có ghi chú).

Verification:
  npx vitest run src/lib/puzzle → 54 passed
  npm run build → OK

Nhờ review 2 tầng:
1) Correctness — segment semantics, publish gate, state pipeline
2) Playability & seed — greedy+prune có đủ cho production seed CÓ KIỂM SOÁT (§0.1)?
   7 seed có đủ hấp dẫn? UX đủ cho người chưa biết One-Up?

Không claim hoàn hảo. Mục tiêu: đủ public beta chưa; điều kiện trước public rộng?

Trân trọng,
[…]
```

---

## 5. Điểm số maintainer (để reviewer phản biện)

| Hạng mục | Điểm |
|----------|------|
| Engine correctness | 8.5/10 |
| Seed safety | 8/10 |
| Generation quality (Mức 2) | 7/10 |
| Player UX | 8/10 |
| Production readiness (beta) | 7.5/10 |
| E2E / catalog scale | 4/10 |

**Beta có kiểm soát:** Có. **Public rộng tự động:** Chưa.

---

*Cập nhật file này khi đổi số test, verification, hoặc phạm vi beta.*
