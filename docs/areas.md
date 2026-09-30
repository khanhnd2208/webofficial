# Bản đồ 3 khu vực

Web vẫn là **một app Next.js, một repo, một lần deploy**. Ba khu vực dưới đây là ranh giới để bảo trì và để CI chọn end-to-end test. Không đổi URL, database, hay đăng nhập.

Sửa danh sách này thì sửa cùng lúc:

- luật import trong `eslint.config.mjs`
- bộ lọc khu vực trong `.github/e2e-path-filters.yml`
- bộ lọc file chưa phân loại trong `.github/e2e-outside-filter.yml` (bước CI này dùng `predicate-quantifier: every`, vì `**` cộng pattern phủ định không có tác dụng với quantifier mặc định)

## Boardgame

Game đang có: Cheese Thief, Ma sói, Spyfall, và phòng test.

- `src/features/cheese-thief`
- `src/features/werewolf`
- `src/features/spy-fall`
- `src/features/board-game-test`
- `src/app/my-space/board-game`
- `src/app/api/cheese-thief`
- `src/app/api/ma-soi`
- `src/app/api/spy`
- `src/app/api/admin/board-game`
- `public/board-game` (ảnh và âm thanh của game)

Các game dùng chung helper nội bộ của Spyfall (`src/features/spy-fall/lib/cn`, `components/ui`, `lib/appError`). Đó vẫn là code của khu boardgame, chưa phải phần dùng chung của cả web.

## Giới thiệu và khóa học

Trang công khai, bài viết, dịch vụ, và khóa học tự học.

- `src/app/page.tsx`
- `src/app/gioi-thieu`, `muc-luc`, `du-an`, `dich-vu`, `ghi-chep`, `lien-he`, `hoc`, `chinh-sach`
- `src/app/my-space/courses`
- `src/app/tai-khoan/hoc`
- `src/features/portfolio`, `posts`, `courses`, `learn`, `services`, `inquiries`, `enrollments`, `progress`
- `src/components/learn`, `marketing`, `contact`
- `src/content`
- `src/app/api/learn`, `learning`, `inquiries`, `posts`
- `src/app/api/admin/courses`, `posts`, `enrollments`, `inquiries`, `learn`
- `src/app/admin/courses`, `posts`, `enrollments`, `inquiries`, `learn`, `learn-analytics`
- `content/learn`

`src/features/progress` là tiến độ học của khóa học (học viên xem bài, hoàn thành bài). Nó đi cùng khóa học, không phải sổ điểm của lớp.

## Quản lý lớp

Lớp dạy, My Class, Active Recall, và bài test trong My Space.

- `src/features/teaching`, `my-class`, `active-recall`, `myspace-tests`
- `src/app/my-space/teaching`, `my-class`, `active-recall`, `tests`
- `src/app/lop`
- `src/components/teaching`, `myclass`, `active-recall`, `knowledge`
- `src/app/api/teaching`, `my-class`, `myspace-tests`
- `src/app/api/admin/teaching`, `my-class`, `active-recall`, `myspace-tests`, `myspace-questions`, `myspace-subjects`
- `src/app/admin/teaching`, `my-class`, `active-recall`, `myspace-tests`
- `content/active-recall`

`src/components/knowledge` là giao diện bài học của My Class. Tiến độ trong lớp nằm ở `src/features/my-class`, không nằm ở `src/features/progress`.

## Dùng chung

Cả ba khu được phép import những chỗ này:

- `src/lib`, `src/config`, `src/models`, `src/services`, `src/types`, `src/utils`
- `src/components/ui`, `site`, `motion`, `admin`
- đăng nhập (`src/app/dang-nhap`, `src/app/api/auth`) và health check
- shell `/my-space` (`layout.tsx`, `page.tsx`) và shell `/admin`
- `src/proxy.ts` (Next 16 đổi tên từ `middleware.ts`)
- `prisma/`
- `scripts/` (deploy và seed; sửa ở đây chạy toàn bộ end-to-end)

Admin và `/my-space` là cửa vào chung, nên file shell được phép gọi cả ba khu. Luật ESLint không áp lên các file đó.

Vocabulary, tin nhắn, và `src/app/vocabulary` chưa thuộc một khu nào. Sửa chúng được xem là thay đổi chưa phân loại, và CI sẽ chạy hết end-to-end.

## Luật import

ESLint (`no-restricted-imports`) cấm import chéo:

- boardgame không import quản lý lớp hay khóa học
- quản lý lớp không import boardgame hay khóa học
- khóa học không import boardgame hay quản lý lớp

Import trong cùng một khu vẫn hợp lệ. Ví dụ Cheese Thief import UI của Spyfall.

## End-to-end theo khu

`e2e/smoke.spec.ts`, `e2e/public-feature-locks.spec.ts`, và `e2e/mobile-smoke.spec.ts` luôn chạy.

| Khu vừa sửa                                   | Spec chạy thêm                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------- |
| Boardgame                                     | `board-game-visual`, `board-game-test-rooms`                                          |
| Khóa học / giới thiệu                         | `editorial-premium`                                                                   |
| Quản lý lớp                                   | `active-recall*`, `teaching-*`, `admin-workspace`, và `teaching-groups` (bật cờ nhóm) |
| Phần dùng chung, hoặc file chưa thuộc khu nào | toàn bộ spec ở trên                                                                   |

Sửa `docs/` hoặc file Markdown không kéo theo spec của từng khu. Smoke vẫn chạy.

Trên pull request, CI so với nhánh `main`. Khi push lên `main`, CI so với commit gần nhất trên `main` đã qua CI, chứ không chỉ so với lần push liền trước. Nếu một lần chạy bị huỷ hoặc bị đỏ, lần chạy sau vẫn test phần thay đổi đó trước khi deploy. Không tìm được commit xanh nào thì CI chạy toàn bộ spec.
