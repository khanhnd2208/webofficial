# ThinkGrid — Toàn bộ logic tạo & kiểm tra puzzle (một file)

**Mục đích:** Tài liệu gửi chuyên gia — mô tả **đầy đủ** cách hệ thống hiện tại tạo, kiểm tra và xuất bản câu đố ThinkGrid (One-Up style).  
**Phiên bản:** 2026-05-25 — validator **v1.7.0** (segment feasibility, runtime guard, solver budget, puzzleKind).  
**Mã nguồn:** `src/lib/puzzle/*`, `prisma/puzzle-seed-data.ts`, `prisma/puzzle-seed-runner.ts`, `src/services/puzzleService.ts`.

**Tài liệu liên quan (không bắt buộc đọc hết):**

| File | Vai trò |
|------|---------|
| [`thinkgrid-technical-spec.md`](./thinkgrid-technical-spec.md) | Spec API, DB, player pipeline |
| [`thinkgrid-expert-handoff.md`](./thinkgrid-expert-handoff.md) | Gói gửi reviewer ngắn |
| [`thinkgrid-production-checklist.md`](./thinkgrid-production-checklist.md) | Deploy, seed, smoke |

---

## Mục lục

1. [Tóm tắt một trang](#1-tóm-tắt-một-trang)
2. [Luật chơi & khái niệm toán](#2-luật-chơi--khái-niệm-toán)
3. [Mô hình dữ liệu layout](#3-mô-hình-dữ-liệu-layout)
4. [Biên dịch layout → segments & CellMeta](#4-biên-dịch-layout--segments--cellmeta)
5. [Pipeline tạo puzzle (hiện trạng vs mục tiêu)](#5-pipeline-tạo-puzzle-hiện-trạng-vs-mục-tiêu)
6. [Gate P0: Segment domain feasibility](#6-gate-p0-segment-domain-feasibility)
7. [Gate layout quality (hard / soft)](#7-gate-layout-quality-hard--soft)
8. [Solver & kiểm tra nghiệm duy nhất](#8-solver--kiểm-tra-nghiệm-duy-nhất)
9. [Chọn givens (Mức 2)](#9-chọn-givens-mức-2)
10. [Đánh giá độ khó](#10-đánh-giá-độ-khó)
11. [Hàm publish tổng hợp](#11-hàm-publish-tổng-hợp)
12. [Seed & đồng bộ DB](#12-seed--đồng-bộ-db)
13. [Admin tạo/sửa puzzle](#13-admin-tạo-sửa-puzzle)
14. [Player: catalog & chơi (không leak đáp án)](#14-player-catalog--chơi-không-leak-đáp-án)
15. [Lỗi kinh điển (ảnh 1) & bài học](#15-lỗi-kinh-điển-ảnh-1--bài-học)
16. [Bản đồ file code](#16-bản-đồ-file-code)
17. [Câu hỏi gợi ý cho chuyên gia](#17-câu-hỏi-gợi-ý-cho-chuyên-gia)

---

## 1. Tóm tắt một trang

ThinkGrid **không phải Sudoku**. Mỗi **segment** (đoạn liên tiếp trên một hàng hoặc một cột, bị cắt bởi **tường** hoặc **ô đen**) độ dài `L` phải chứa đúng các số **1, 2, …, L** (không trùng trong segment). Cùng một hàng/cột toàn lưới **có thể** lặp số nếu hai ô nằm ở **hai segment khác nhau**.

**Tạo nội dung hiện tại (Mức 1 + Mức 2, chưa có generator tự động đầy đủ):**

1. **Author / seed** thiết kế `layout` (tường + blocked + có thể givens tay).
2. **`compilePuzzle(layout)`** → segments H/V, `maxAllowedValue` từng ô.
3. **Gate feasibility** (P0): mỗi segment có đủ “room” cho 1..L theo cap ô — **trước** solver.
4. **Gate layout quality**: tỷ lệ given, số tường, blocked-only trên 8×8, v.v.
5. **`findFirstSolution`** → một nghiệm đầy đủ.
6. **`pickGivensForUnique`**: shuffle deterministic theo `dateKey`, greedy thêm given đến khi unique, prune thừa.
7. **`validatePuzzleForPublish`**: layout + solution + unique + quality + difficulty warning.
8. **Seed runner** ghi DB `PUBLISHED`; player chọn câu qua `/api/puzzle/catalog`.

**Chưa có trong repo:** generator “wall-first” tự sinh layout (rejection sampling từng bước tường) — chỉ có **gate** để từ chối layout xấu và **seed tay** 8 câu trong `puzzle-seed-data.ts`.

---

## 2. Luật chơi & khái niệm toán

### 2.1 Segment ngang (H) và dọc (V)

- Quét từng **hàng** `r`: gom các ô playable liên tiếp theo cột, **dừng** khi gặp `verticalWalls[r][c+1]` hoặc ô blocked kế tiếp.
- Quét từng **cột** `c`: gom các ô playable liên tiếp theo hàng, **dừng** khi gặp `horizontalWalls[r+1][c]` hoặc ô blocked kế tiếp.

Mỗi segment có `length = L` và khi **hoàn chỉnh** phải là hoán vị của `{1,…,L}` trên các ô của segment đó.

### 2.2 Domain (cap) của một ô

Tại ô playable `(r,c)` thuộc segment H độ dài `L_H` và segment V độ dài `L_V`:

```text
maxAllowedValue = min(L_H, L_V)
```

Người chơi chỉ nhập số trong `1 .. maxAllowedValue`. Đây là giao của hai ràng buộc segment — **không** phải domain độc lập theo hàng/cột full grid.

### 2.3 Khác Sudoku (cố ý thiết kế)

```text
Sudoku:     mỗi hàng/cột full grid = 1..size, không trùng
ThinkGrid:  mỗi segment H/V (độ dài biến thiên) = 1..L, không trùng trong segment
```

Puzzle “cảm giác One-Up” tốt thường có **cùng số lặp lại trên một hàng/cột** nhưng ở **hai segment khác nhau** (bị tường ngăn). Hệ thống cảnh báo (không chặn publish) nếu solution không có hiện tượng đó trên grid ≥ 4×4.

---

## 3. Mô hình dữ liệu layout

### 3.1 Type `DailyPuzzleLayout`

```ts
interface DailyPuzzleLayout {
  size: number;                     // 3..9
  blocked: boolean[][];             // size × size — ô đen, không chơi
  verticalWalls: boolean[][];       // size × (size+1)
  horizontalWalls: boolean[][];     // (size+1) × size
  givens: Record<string, number>;  // key "row,col" → số cho sẵn
}
```

### 3.2 Semantics tường (quan trọng cho UI = engine)

| Ma trận | Ý nghĩa |
|---------|---------|
| `verticalWalls[r][c] === true` | Tường **cạnh trái** ô `(r,c)`; tường giữa `(r,c)` và `(r,c-1)` khi `c>0` |
| `horizontalWalls[r][c] === true` | Tường **cạnh trên** ô `(r,c)`; tường giữa `(r,c)` và `(r-1,c)` khi `r>0` |

**Tường ngoài** luôn `true` (hàng 0 và `size` của `horizontalWalls`; cột 0 và `size` của `verticalWalls`). Hàm `ensureOuterWalls` / `validateLayout` bắt buộc.

**Nguyên tắc thiết kế:** **Tường là cơ chế chính** để chia segment; **ô đen (blocked)** chỉ là phụ trợ (cắt segment, tăng độ khó), không thay thế tường trên board lớn (đặc biệt 8×8).

### 3.3 Lưu trữ DB

- Bảng `DailyPuzzle`: `layoutJson`, `solutionJson`, `size`, `dateKey`, `status` (`DRAFT` | `PUBLISHED` | `VALIDATED`), `difficulty`.
- **Không** gửi `solutionJson` cho client khi chơi; chỉ layout + givens + progress.

---

## 4. Biên dịch layout → segments & CellMeta

**File:** `compiler.ts`, `segments.ts`, `layoutUtils.ts`

### 4.1 Thuật toán build segment (tóm tắt)

```
FOR mỗi hàng r:
  WHILE c < size:
    bỏ qua blocked
    gom ô playable liên tiếp đến khi:
      - hết hàng, HOẶC
      - verticalWalls[r][c+1], HOẶC
      - ô (r,c+1) blocked
    → tạo Segment H-{id}, length = số ô

FOR mỗi cột c: (tương tự theo hàng, dùng horizontalWalls)
    → Segment V-{id}
```

### 4.2 `CompiledPuzzle`

Sau `compilePuzzle(layout)`:

| Trường | Ý nghĩa |
|--------|---------|
| `horizontalSegments`, `verticalSegments` | Danh sách segment |
| `segmentById` | Tra cứu nhanh |
| `cells[r][c]` → `CellMeta` | `hSegmentId`, `vSegmentId`, `hSegmentLength`, `vSegmentLength`, `maxAllowedValue`, `isGiven`, `givenValue` |
| `playableKeys` | Mọi key `"r,c"` không blocked |

---

## 5. Pipeline tạo puzzle (hiện trạng vs mục tiêu)

### 5.1 Pipeline **đang chạy** (seed + admin)

```text
┌─────────────────────────────────────────────────────────────────┐
│ 1. Thiết kế layout (tay / seed-data / admin editor)             │
│    — walls chính, blocked phụ                                   │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. compilePuzzle(layout)                                        │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. getSegmentFeasibilityErrors(compiled)     [P0 — HARD FAIL]  │
│    assessLayoutQuality(layout)               [errors + warnings]│
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. findFirstSolution(compiled)             [backtracking MRV] │
│    — nếu feasibility fail → không gọi solver (publish path)     │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. pickGivensForUnique(layout, solution, { seedKey: dateKey })  │
│    — shuffle deterministic → greedy add → prune               │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. validatePuzzleForPublish(layout, solution)                   │
│    — validateLayout, givens, full solution, unique, gates, diff │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Lưu DB / Publish — puzzle-seed-runner hoặc admin API         │
└─────────────────────────────────────────────────────────────────┘
```

**Hàm seed:** `buildFromLayout()` trong `prisma/puzzle-seed-data.ts` thực hiện bước 2→5 cho từng `dayN()`.

### 5.2 Pipeline **mục tiêu** (Mức 3 — chưa code generator)

```text
Generate wall proposals (rejection sampling)
  → sau MỖI tường: compile + segmentFeasibility + layoutQuality.errors
  → khi đủ breaks: findFirstSolution
  → pickGivensForUnique
  → validatePuzzleForPublish
  → human playtest
```

Pseudo-code tham chiếu (từ review nội bộ):

```ts
for (attempt = 0; attempt < 1000; attempt++) {
  layout = createEmptyLayout(size)
  for (step = 0; step < targetBreaks; step++) {
    proposal = proposeRandomWall(layout, rng)
    next = applyWallProposal(layout, proposal)
    if (getSegmentFeasibilityErrors(compile(next)).length) continue
    if (assessLayoutQuality(next).errors.length) continue
    layout = next
  }
  if (!findFirstSolution(compile(layout))) continue
  return { layout, solution, givens: pickGivensForUnique(...) }
}
throw new Error('Cannot generate feasible layout')
```

---

## 6. Gate P0: Segment domain feasibility

**File:** `src/lib/puzzle/segmentFeasibility.ts`  
**Gọi từ:** `layoutQuality.ts`, `puzzleValidation.ts` (trước `countSolutions`).

### 6.1 Quy tắc toán (bắt buộc trước solver)

Với mỗi segment `S` độ dài `L`, khi **chưa biết** gán số, mỗi ô `i` trong `S` chỉ có thể nhận tối đa:

```text
cap_i = min(L, maxAllowedValue của ô i)
```

Sắp `caps` tăng dần: `caps[0] ≤ caps[1] ≤ … ≤ caps[L-1]`.

**Điều kiện cần** để segment **có thể** chứa `1..L`:

```text
∀i ∈ [0..L-1]:  caps[i] ≥ i + 1
```

Nếu vi phạm → segment **không thể** chứa giá trị `i+1` nào đó → layout **reject** (hard error).

### 6.2 Ví dụ lỗi ảnh 1 (8×8 chỉ tường dọc giữa)

```text
Mỗi hàng: segment H dài 4  → mọi ô cap ≤ 4
Mỗi cột:  segment V dài 8  → cần đặt số 5,6,7,8 trong cột

caps cột (8 ô) ≈ [4,4,4,4,4,4,4,4]
Kiểm tra: caps[4] ≥ 5 ?  → 4 ≥ 5 → FAIL
```

Một ô đen giữa **không sửa** được vì các cột khác vẫn dài 8.

### 6.3 Cách sửa layout kiểu “chia 4 ô 4×4” (seed day8)

Trên 8×8 **chẵn**, thêm **cả** tường dọc giữa (`verticalWalls[r][4]`) **và** tường ngang giữa (`horizontalWalls[4][c]`):

```text
→ Mọi segment H và V trong mỗi góc đều dài 4
→ cap mỗi ô ≤ 4, segment cần 1..4 → feasible
```

**Lưu ý:** Chia đôi **một** trục trên lưới **lẻ** (5×5 tại cột 2, 7×7 tại cột 3) dễ tạo strip 3×4 với `min(3,4)=3` nhưng segment dài 4 → **cùng một lỗi cap** — gate sẽ reject. Seed 5×5/7×7 hiện dùng **blocked** hoặc tường **cục bộ**, không split full midline lẻ.

### 6.4 Kiểm tra mạnh hơn khi đã có givens

`getSegmentGivensFeasibilityErrors(compiled)`:

- Trong mỗi segment: given không trùng, nằm trong `1..L`.
- Các giá trị còn thiếu trong `{1..L}` phải gán được cho ô trống bằng **bipartite matching** (ô trống `j` nhận value `v` nếu `v ≤ maxAllowedValue_j`).
- `L ≤ 9` → matching rất nhẹ.

### 6.5 Debug cho dev

```ts
import { explainLayoutFeasibility } from '@/lib/puzzle/segmentFeasibility'
import { compilePuzzle } from '@/lib/puzzle/compiler'

console.table(explainLayoutFeasibility(compilePuzzle(layout)))
// → id, direction, length, caps[], feasible
```

---

## 7. Gate layout quality (hard / soft)

**File:** `src/lib/puzzle/layoutQuality.ts`  
**Hằng số:** `DEFAULT_QUALITY_THRESHOLDS`

### 7.1 Hard errors (không publish / seed fail)

| Rule | Điều kiện |
|------|-----------|
| Segment feasibility | Mọi lỗi từ §6 |
| Given ratio | `givenCount/playable > 52%` |
| Segment length 1 | Quá 42% ô playable thuộc segment độ dài 1 |
| Grid ≥ 6 | Ít nhất 2 “breaks” (internal walls + blocked) — `minBreaksForSize6` |
| Grid ≥ 5, không tường không blocked | “No walls or blocked cells” |
| Grid ≥ 6 | `minInternalWallsBySize`: 6→4, 8→6 tường **nội bộ** (không tính viền) |
| Grid ≥ 8 | Phải có **cả** tường dọc và ngang nội bộ |
| Grid ≥ 8 | Không cho layout **chỉ** blocked, không tường nội bộ |

### 7.2 Warnings (publish được, cần review người)

- Ít tường/blocked (< 2 breaks trên grid ≥ 4).
- Không tường nội bộ trên grid ≥ 5.
- Segment lengths ít đa dạng.
- Given ratio cao (>45%) hoặc thấp (<12%).
- 7×7 chỉ blocked: gợi ý thêm tường cục bộ.

### 7.3 Bảng ngưỡng mặc định

```ts
maxGivenRatio: 0.52
maxSegmentLength1Ratio: 0.42
minBreaksForSize6: 2
minInternalWallsBySize: { 6: 4, 8: 6 }
```

---

## 8. Solver & kiểm tra nghiệm duy nhất

**File:** `solver.ts`

| Hàm | Mô tả |
|-----|--------|
| `findFirstSolution(compiled)` | Backtracking + MRV (ô ít candidate nhất), dùng `getCandidates` + `isLegalUserMove` |
| `countSolutions(compiled, state?, limit)` | Đếm nghiệm tới `limit` (publish dùng `limit=2` → 0 / 1 / ≥2) |
| `hasUniqueSolution(compiled)` | `countSolutions === 1` |

**Publish yêu cầu:** đúng **1** nghiệm trên toàn bộ lưới (với givens đã chốt).

**Thứ tự:** Nếu `getSegmentFeasibilityErrors` không rỗng → `validatePuzzleForPublish` **không** gọi `countSolutions` (tiết kiệm, tránh layout vô nghiệm).

---

## 9. Chọn givens (Mức 2)

**File:** `givenPicker.ts`, `seedShuffle.ts`

### 9.1 Thuật toán `pickGivensForUnique`

```text
INPUT: layout (givens rỗng), solution đầy đủ, optional seedKey (= dateKey)

1. keys = deterministicShuffle(playableKeys sorted, seedKey)
2. givens = {}
3. FOR key IN keys:
     givens[key] = solution[key]
     IF hasUniqueSolution(compile(layout with givens)): BREAK
4. IF NOT unique: THROW
5. pruneOrder = shuffle(keys(givens), seedKey + ":prune")
6. FOR key IN pruneOrder:
     thử xóa key khỏi givens
     IF vẫn unique: giữ xóa; ELSE: khôi phục
7. RETURN givens
```

**Mục đích:** Tránh bias givens góc trên-trái; số given tối thiểu (local minimum) nhưng vẫn unique.

### 9.2 Ràng buộc givens (`validateGivens`)

- Mỗi given ∈ `1..maxAllowedValue` ô đó.
- Không hai given cùng giá trị trong **cùng** segment H hoặc V.

---

## 10. Đánh giá độ khó

**File:** `difficultyEvaluator.ts`

Không phải solver tối ưu — **mô phỏng người chơi**:

1. Bắt đầu từ givens.
2. Lặp: gán mọi ô chỉ còn 1 candidate (forced).
3. Nếu kẹt: chọn ô MRV, thử candidate **đầu tiên** (một nhánh).
4. Metrics: `placementSteps`, `forcedPlacements`, `branchPlacements`, `maxBranchWidth`, `score`, `requiresGuessing`.

**Publish:** `requiresGuessing === true` → **warning** (không chặn), gợi ý quá khó cho daily logic-only.

---

## 11. Hàm publish tổng hợp

**File:** `puzzleValidation.ts` — `validatePuzzleForPublish(layout, solution)`

```text
1. validateLayout(layout)           — size, ma trận, viền, given không trên blocked
2. compilePuzzle(layout)
3. getSegmentFeasibilityErrors       — HARD (trước solver)
4. validateGivens + getSegmentGivensFeasibilityErrors
5. validateFullSolution              — mọi ô playable có số; isSolved; khớp givens
6. countSolutions (skip nếu bước 3 fail)
   — 0 nghiệm / ≥2 nghiệm → HARD
7. assessLayoutQuality.errors        — HARD
8. evaluateDifficulty → warnings
9. hasCrossSegmentDuplicateInSolution — warning “Latin square feel” nếu false
```

**Admin:** API validate/publish gọi cùng logic (solver gate trên server).

---

## 12. Seed & đồng bộ DB

### 12.1 Nguồn puzzle cố định

**File:** `prisma/puzzle-seed-data.ts` — `buildSeedPuzzles()` → **8** câu:

| dateKey | Size | Đặc điểm layout |
|---------|------|-----------------|
| 2026-05-19 | 4×4 | Quadrants (tường giữa) |
| 2026-05-20 | 5×5 | 1 blocked |
| 2026-05-21 | 5×5 | 1 blocked giữa |
| 2026-05-22 | 6×6 | Quadrants 3\|3 |
| 2026-05-23 | 5×5 | 2 blocked góc |
| 2026-05-24 | 5×5 | 2 blocked |
| 2026-05-25 | 7×7 | 3 blocked (today) |
| 2026-05-26 | 8×8 | Tường dọc **+** ngang giữa + 1 blocked; title `ThinkGrid #8 — 8×8 (4×4×4)` |

Mỗi câu: `buildFromLayout` → solver → `pickGivensForUnique` → object `{ dateKey, title, difficulty, layout, solution }`.

### 12.2 Runner

**File:** `prisma/puzzle-seed-runner.ts`

| Mode | Lệnh | Hành vi |
|------|------|---------|
| `dev` / `staging` | `PUZZLE_SEED_CONFIRM=WipeAll` + `db:seed:puzzle:dev` | Xóa hết attempts + puzzles, insert lại 8 câu |
| `future` | `npm run db:seed:puzzle:future` | Upsert theo `dateKey`; **không** xóa attempt |

**Stale detection:** So sánh `size`, `title`, và **toàn bộ** `verticalWalls` / `horizontalWalls` / `blocked` với seed. Khác → update (nếu puzzle chưa có attempt).

**Nếu puzzle đã có attempt:** skip (immutable) — **8×8 cũ chỉ tường dọc** có thể kẹt trong DB cho đến khi xóa attempt hoặc sửa admin.

### 12.3 Kiểm tra DB

```bash
npm run db:puzzle:check
```

Cảnh báo nếu thiếu 8×8 hoặc `< 8` câu published. Meta: `src/lib/puzzle/seedCatalogMeta.ts` (`PUZZLE_SEED_8X8_DATE_KEYS = ['2026-05-26']`).

### 12.4 Deploy production

```bash
npm run db:migrate:deploy
npm run db:seed:puzzle:future
npm run db:puzzle:check
```

---

## 13. Admin tạo/sửa puzzle

**UI:** `src/components/puzzle/admin/PuzzleEditor.tsx`, `EditorBoard.tsx`

- Toggle `verticalWalls` / `horizontalWalls` / `blocked` / givens / solution mode.
- **Validate** → gọi API chạy cùng `validatePuzzleForPublish` (+ solver).
- **Publish** chỉ khi validation OK.

**Khuyến nghị author:** Sau khi vẽ tường, chạy validate; nếu lỗi feasibility → đọc message `cannot place value N` hoặc `explainLayoutFeasibility`.

---

## 14. Player: catalog & chơi (không leak đáp án)

- **Catalog:** `GET /api/puzzle/catalog` — mọi `PUBLISHED`; `diagnostics.missing8x8` nếu DB thiếu 8×8 so với seed meta.
- **Chơi:** `/puzzle?puzzleId=<id>` — không bắt buộc một câu/ngày.
- **Today API:** `GET /api/puzzle/today?puzzleId=` hoặc theo `dateKey` (VN).
- **Submit:** Server `composeStateWithGivens` + `isSolved` — **không** so sánh client với `solutionJson`.

---

## 15. Lỗi kinh điển (ảnh 1) & bài học

### 15.1 Triệu chứng

Board 8×8 nhìn như **một đường dọc giữa**, không thấy (hoặc DB không có) tường ngang → segment dọc dài 8 trong khi cap ô ≤ 4.

### 15.2 Nguyên nhân có thể

1. **DB stale:** Seed code đã có `horizontalWalls[4][*]` nhưng row DB tạo trước đó; future seed skip vì đã có attempts.
2. **Layout author:** Chỉ bật tường dọc full-height trên 8×8.
3. **Hiếm:** UI không vẽ `borderTop` — cần đối chiếu `layoutJson` API với `PuzzleBoard` (`hasWallTop` / `horizontalWalls[r][c]`).

### 15.3 Phòng ngừa đã code

- Gate §6 reject trước publish/seed validate.
- 8×8 bắt buộc tường hai hướng (§7).
- Seed runner so sánh `layoutJson` để thay bản cũ.

---

## 16. Bản đồ file code

| Chức năng | File |
|-----------|------|
| Types layout/public | `src/types/puzzle.ts` |
| Tạo layout rỗng, semantics tường | `src/lib/puzzle/layoutUtils.ts` |
| Build H/V segments | `src/lib/puzzle/segments.ts` |
| Compile → CellMeta | `src/lib/puzzle/compiler.ts` |
| **Segment feasibility P0** | `src/lib/puzzle/segmentFeasibility.ts` |
| Layout quality gates | `src/lib/puzzle/layoutQuality.ts` |
| Candidates & legal move | `src/lib/puzzle/candidates.ts`, `statePipeline.ts` |
| Validator layout/givens/solved | `src/lib/puzzle/validator.ts` |
| Solver | `src/lib/puzzle/solver.ts` |
| Pick givens | `src/lib/puzzle/givenPicker.ts`, `seedShuffle.ts` |
| Difficulty | `src/lib/puzzle/difficultyEvaluator.ts` |
| **Publish tổng hợp** | `src/lib/puzzle/puzzleValidation.ts` |
| Seed data | `prisma/puzzle-seed-data.ts` |
| Seed DB runner | `prisma/puzzle-seed-runner.ts` |
| DB check | `prisma/puzzle-db-check.ts` |
| Catalog meta | `src/lib/puzzle/seedCatalogMeta.ts` |
| Service/API | `src/services/puzzleService.ts`, `src/app/api/puzzle/*` |
| Tests | `src/lib/puzzle/__tests__/*.test.ts` (61 tests puzzle lib) |

---

## 17. Câu hỏi gợi ý cho chuyên gia

1. **Điều kiện `caps[i] ≥ i+1`** có đủ làm gate tiền-solver cho mọi layout không có given, hay cần thêm điều kiện (ví dụ Hall trên toàn grid)?
2. **Chiến lược sinh layout** tối ưu cho daily: wall-first rejection vs template quadrants (chỉ size chẵn) vs hybrid?
3. **Lưới lẻ (5, 7):** Có nên cấm hoàn toàn “midline split” trên một trục không, hay generator riêng cho odd sizes?
4. **Given ratio 52%** và **prune greedy** — có bias độ khó / vùng trống không mong muốn?
5. **`evaluateDifficulty` (một nhánh MRV)** có tương quan đủ với độ khó thực tế người chơi không?
6. **Cảnh báo “Latin square feel”** — nên là hard rule cho tutorial hay chỉ soft?
7. **Seed immutable khi có attempts** — quy trình sửa layout sai (8×8 stale) trên production: xóa attempt vs version puzzle mới?

---

---

## 18. Validator v1.7.0 (production guards)

| Thành phần | File |
|------------|------|
| `PUZZLE_VALIDATOR_VERSION = '1.7.0'` | `puzzlePolicy.ts` |
| Solver budget publish/seed | `SOLVER_LIMITS` → `countSolutions` / `findFirstSolution` |
| Runtime: không serve puzzle fail gate | `puzzleRuntimeGuard.ts` + `puzzleService.ts` |
| DB check exit 1 nếu published fail | `npm run db:puzzle:check` |
| Metadata: `validatorVersion`, `layoutHash`, `solutionHash`, `validationStatus`, `puzzleKind` | Prisma `DailyPuzzle` |
| Daily ≥5: ≥2 internal walls, không blocked-only | `layoutQuality.ts` (`puzzleKind=DAILY`) |
| Tutorial: nới given ratio; bắt buộc demo One-Up (cross-segment duplicate) | `validatePuzzleForPublish` |
| Wall UI = engine | `__tests__/wallRender.test.ts` |

Seed catalog: **day1 + day2–3,5–7** = `TUTORIAL` (blocked layouts); **day4, day8** = `DAILY` (có tường).

---

*Tài liệu này phản ánh code tại nhánh làm việc ngày 2026-05-25. Khi đổi gate hoặc thêm generator Mức 3, cập nhật §5.2, §12 và bump `PUZZLE_VALIDATOR_VERSION`.*
