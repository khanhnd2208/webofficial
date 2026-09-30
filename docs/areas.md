# Bản đồ khu vực

Web vẫn là **một app Next.js, một repo, một lần deploy**. Bốn khu vực dưới đây là ranh giới để bảo trì và để CI chọn end-to-end test. Chúng không đổi URL, database, hay đăng nhập.

## Nguồn sự thật duy nhất

Danh sách đường dẫn của từng khu nằm ở **`scripts/areas/areas.mjs`**. Mọi thứ khác đọc hoặc sinh ra từ file đó:

| Nơi dùng                                                           | Cách lấy                                   |
| ------------------------------------------------------------------ | ------------------------------------------ |
| Luật import trong `eslint.config.mjs`                              | import trực tiếp `areas.mjs`               |
| `.github/e2e-path-filters.yml`, `.github/e2e-outside-filter.yml` | sinh bằng `npm run areas:sync`             |
| CI (job "Typecheck, lint, audit")                                  | `npm run areas:check` chặn khi bị lệch     |

Khi thêm thư mục hoặc route mới:

1. Thêm đường dẫn vào đúng khu (hoặc `SHARED`) trong `scripts/areas/areas.mjs`.
2. Chạy `npm run areas:sync` và commit cả hai file `.github/e2e-*.yml`.
3. Chạy `npm run lint` để xem luật import mới có bắt lỗi nào không.

`npm run areas:check` báo lỗi khi:

- file bộ lọc CI không khớp với `areas.mjs`
- một đường dẫn trong danh sách không còn tồn tại
- hai khu cùng nhận một đường dẫn
- có file trong `src/` không thuộc khu nào và cũng không thuộc phần dùng chung

## Boardgame

Game đang có: Cheese Thief, Ma sói, Spyfall, và phòng test cho admin.

- `src/features/board-game-shared`, `cheese-thief`, `werewolf`, `spy-fall`, `board-game-test`
- `src/app/my-space/board-game`, `src/app/api/cheese-thief`, `ma-soi`, `spy`, `src/app/api/admin/board-game`
- `public/board-game` (ảnh và âm thanh của game)

`src/features/board-game-shared` chứa phần các game dùng chung: khung API (`lib/apiUtils`, `lib/gameError`), i18n, theme, UI (`components/ui`), và các component người chơi. Đây là phần chung của khu boardgame, không phải của cả web. `GameError` mang mã lỗi cho client. Đừng nhầm với `AppError` trong `src/lib`, loại nhận thông báo lỗi.

## Quản lý lớp

Lớp dạy, My Class, Active Recall, bài test trong My Space, và kho từ vựng.

- `src/features/teaching`, `my-class`, `active-recall`, `myspace-tests`
- `src/components/teaching`, `myclass`, `active-recall`, `knowledge`, `vocab`, `myspace/quiz`, `myspace/tests`
- `src/app/my-space/teaching`, `my-class`, `active-recall`, `tests`, và `src/app/lop`, `progress`, `vocabulary`
- API và admin tương ứng, gồm `vocab-sets`, `admin/tools/active-recall`, `admin/tools/vocabulary`
- `content/active-recall`

Vocabulary thuộc khu này vì bài từ vựng trong My Class dùng lại trang của `src/app/vocabulary` và `src/components/vocab`. `src/components/knowledge` là giao diện bài học của My Class. Tiến độ trong lớp nằm ở `src/features/my-class`, không ở `src/features/progress`.

## Giới thiệu và khóa học (portfolio)

Trang công khai, bài viết, dịch vụ, và khóa học tự học.

- `src/app/page.tsx`, `gioi-thieu`, `muc-luc`, `du-an`, `trai-nghiem`, `dich-vu`, `ghi-chep`, `lien-he`, `hoc`, `chinh-sach`
- `src/app/my-space/courses`, `src/app/tai-khoan/hoc`
- `src/features/portfolio`, `posts`, `courses`, `learn`, `services`, `experiences`, `inquiries`, `enrollments`, `progress`
- `src/components/learn`, `marketing`, `contact`
- `src/content`, `content/learn`, `public/learn`, `src/app/learn.css`, `src/app/personal-book.css`
- API và admin tương ứng

`src/features/progress` là tiến độ học của khóa học (học viên xem bài, hoàn thành bài). Nó đi cùng khóa học, không phải sổ điểm của lớp.

## Công cụ riêng (tools)

Các công cụ độc lập đã chuyển sang trạng thái lưu trữ trong `src/config/moduleRegistry.ts`: Lời nhắn (`/messages`, `/m/[slug]`) và Lucky Card.

- `src/components/messages`
- `src/app/messages`, `src/app/m`, `src/app/api/messages`, `src/app/api/m`
- `src/app/admin/tools/messages`, `src/app/admin/tools/lucky-card`
- `public/music`

Khu này chưa có spec end-to-end riêng, nên sửa ở đây chỉ chạy smoke.

## Dùng chung

Mọi khu được import những chỗ này. Danh sách đầy đủ nằm trong `SHARED` của `areas.mjs`.

- `src/lib`, `config`, `models`, `services`, `types`, `utils`, `test`, `assets`
- `src/components/ui`, `site`, `motion`, `admin`, `forms`, `myspace/MySpaceGrid.tsx`
- shell app (`layout.tsx`, `globals.css`, `my-class-theme.css`, trang lỗi, `robots`, `sitemap`), đăng nhập, tài khoản, shell `/my-space` và shell `/admin` (users, settings, media, website, archive)
- API nền tảng: `auth`, `health`, `profile`, `streak`, `uploads`, `admin/users`
- `src/proxy.ts` (Next 16 đổi tên từ `middleware.ts`), `prisma/`, `scripts/`, file cấu hình ở thư mục gốc

File shell của admin và `/my-space` là cửa vào chung, nên được phép gọi mọi khu. Luật import không áp lên chúng.

### Nợ đã biết: code dùng chung import ngược vào khu

Code dùng chung đúng ra không nên phụ thuộc vào một khu cụ thể. Hiện còn các chỗ sau (ESLint chưa chặn). Sửa dần khi đụng tới:

| File dùng chung                                                                   | Đang import                                  |
| ---------------------------------------------------------------------------------- | -------------------------------------------- |
| `src/config/moduleRegistry.ts`, `adminNavigation.ts`, `components/admin/AdminLocalNav.tsx`, các trang shell admin | `components/myclass/ui/McIcon` |
| `src/components/forms/TiptapEditor.tsx`                                            | `features/my-class/client/adminDraft`        |
| `src/services/vocabSetService.ts`                                                  | `features/my-class/domain/listQuery`         |
| `src/lib/auth/sideEffects.ts`                                                      | `features/my-class/services/cohortService`   |
| `src/lib/apiUtils.ts`                                                              | `features/teaching/groupBoardAvailability`   |
| `src/lib/inquiryEmail.ts`, `models/Inquiry.ts`, `services/inquiryService.ts`       | `features/inquiries`                         |
| `src/components/site/PublicMinimalChrome.tsx`                                      | `components/contact/QuickContactPanel`       |

Hướng sửa thường gặp: chuyển phần được dùng chung (ví dụ `McIcon`, `listQuery`) xuống `src/components/ui` hoặc `src/lib`.

## Luật import

ESLint (`no-restricted-imports`) cấm file của một khu import module của khu khác: `@/features/*`, `@/components/*`, và route `@/app/*` thuộc khu đó. Import trong cùng một khu vẫn hợp lệ, ví dụ Cheese Thief import UI trong `board-game-shared`.

## End-to-end theo khu

`e2e/smoke.spec.ts`, `e2e/public-feature-locks.spec.ts`, và `e2e/mobile-smoke.spec.ts` luôn chạy.

| Khu vừa sửa                                   | Spec chạy thêm                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------- |
| Boardgame                                     | `board-game-visual`, `board-game-test-rooms`                                          |
| Giới thiệu và khóa học                        | `editorial-premium`, `personal-book` |
| Quản lý lớp                                   | `active-recall*`, `teaching-*`, `admin-workspace`, `my-class`, `myspace-tests`, và `teaching-groups` (bật cờ nhóm) |
| Công cụ riêng                                 | không có (chỉ smoke)                                                                  |
| Phần dùng chung, hoặc file chưa thuộc khu nào | toàn bộ spec ở trên                                                                   |

Danh sách spec được chạy nằm trong `.github/workflows/ci.yml` (bước "Release-critical end-to-end tests"). Danh sách `e2e` trong `areas.mjs` chỉ quyết định việc sửa một spec sẽ kéo theo khu nào. `operating-focus` và `my-class.admin` chưa chạy trong CI vì mỗi file còn một test hỏng sẵn trên `main`; ghi chú nằm ngay trong `ci.yml`.

Sửa `docs/` hoặc file Markdown không kéo theo spec của khu nào. Smoke vẫn chạy.

Trên pull request, CI so với nhánh `main`. Khi push lên `main`, CI so với commit gần nhất trên `main` đã qua CI, chứ không chỉ so với lần push liền trước. Nếu một lần chạy bị huỷ hoặc bị đỏ, lần chạy sau vẫn test phần thay đổi đó trước khi deploy. Không tìm được commit xanh nào thì CI chạy toàn bộ spec.
