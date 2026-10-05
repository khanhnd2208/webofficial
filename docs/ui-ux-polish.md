# UI/UX polish — hồ sơ kiểm tra sau phản biện

Ngày: 05/10/2026. Nhánh: `codex/ui-ux-polish`.
Worktree: `/Users/duykhanh/Workspace/Active/wt-ui-ux-polish`.

## Trạng thái và mốc so sánh

- Đã merge `origin/main` tại `a5ce3a4` (PR #21) bằng merge commit `b4ee25d`. Main mới là tổ tiên của nhánh; không rebase hoặc viết lại lịch sử.
- Bản UI ban đầu dựa trên `2d38bf3`; main đã tiến thêm 24 commit. Những kết quả kiểm tra cũ đã được thay bằng kết quả chạy lại sau merge.
- Các thay đổi được commit riêng theo mục đích. Checkout chính không được sửa. Chưa push, mở PR, merge PR hoặc triển khai.
- Dữ liệu kiểm thử chỉ dùng PostgreSQL cục bộ từ `TEST_DATABASE_URL` và MongoDB tạm trong bộ nhớ. Không thay đổi dữ liệu production, schema hoặc dependency.

## 1. Lỗi remount của khu nội bộ

**File:** `src/components/site/MainContent.tsx`.

Nhánh `isInternalChromePath(pathname)` trả trực tiếp:

```tsx
return <div id="main-content">{children}</div>;
```

Không có `JourneyTransition`, `ViewTransition` hoặc key theo pathname ở nhánh này.
Các layout nằm dưới không bị MainContent thay thế khi pathname đổi. Trang công khai tiếp tục dùng `JourneyTransition`; key chỉ nằm trong component đó.

**Kiểm tra:** `src/components/site/MainContent.test.tsx` có bốn trường hợp:

- Ba lần đổi pathname trong My Class: trạng thái mở outline và `scrollTop = 310` giữ nguyên; hàm cleanup mô phỏng ngắt kết nối không chạy.
- Ba pathname admin: cùng các bất biến trên.
- Ba pathname phòng chơi: cùng các bất biến trên.
- Trang công khai vẫn có boundary chuyển trang.

Đây là kiểm tra reconciliation của MainContent với một component giữ trạng thái, không phải bằng chứng đã đi qua ba unit thật trên website. Public My Class hiện bị archive trong main; E2E `my-class.spec.ts` xác nhận các URL learner trả 404 và `noindex, nofollow`. Không mở lại module này chỉ để chụp ảnh hoặc chạy kiểm tra.

## 2. Thang chữ mặc định và typography công khai

**File:** `src/app/globals.css`, phần `@theme inline`.

Đã bỏ các override `--text-xs` đến `--text-5xl`. Tailwind giữ nguyên các bậc: xs 12, sm 14, base 16, lg 18, xl 20, 2xl 24, 3xl 30, 4xl 36, 5xl 48px. Không còn xl = 2xl hoặc 4xl = 5xl do nhánh này ghi đè.

Thêm các utility có tên riêng, tham chiếu token `--type-*` ở root:

| Utility | Cỡ chữ | Token line-height |
| --- | --- | --- |
| `text-caption` | 12px | 1rem |
| `text-label` | 13px | 1.25rem |
| `text-control` | 15px | 1.375rem |
| `text-body` | 17px | 1.75rem |
| `text-lead` | 20px | 1.875rem |
| `text-title` | 24px | 2rem |
| `text-heading` | 32px | 2.5rem |
| `text-display` | 48px | 1.08 |

Utility được khai báo theo cú pháp Tailwind v4: `--text-body` và `--text-body--line-height`, tương tự cho bảy tên còn lại. Các lớp `leading-*` tường minh trên một số đoạn vẫn có thể điều chỉnh line-height theo bố cục.

**Phạm vi chuyển đổi:** trang Giới thiệu, khám phá khóa học, IntroLanding, thanh điều hướng công khai, tài khoản trên thanh, MySpaceGrid, 404 và skeleton. Mục lục dùng utility cho đoạn giới thiệu và token CSS tương ứng trong `toc.module.css`; tiêu đề hero vẫn giữ clamp đáp ứng màn hình. Trang khám phá không còn `text-[17px]` hoặc `text-[15px]`.

**Khu nội bộ:** My Class, Learn reader và Admin không được chuyển đồng loạt sang body 17px. Khôi phục các giá trị font-size cố định đã bị đổi theo thang mới. Các nhãn vốn dưới 12px được nâng lên 12px theo yêu cầu ban đầu; bo góc và thời lượng vẫn theo token chung. Vì vậy không tuyên bố mọi chi tiết nội bộ đều giống hệt main.

**Bằng chứng trình duyệt:** `e2e/ui-ux-regression.spec.ts` đo đoạn giới thiệu công khai 17px và link “Tạo khóa học” trong bảng admin 14px, ở 375px và 1440px; đồng thời kiểm tra không tràn ngang. Khi chạy cùng phép đo với bản build cũ, hai kiểm tra admin thất bại đúng ở giá trị 15px. Bản sửa đạt 14px. Đây là đối chiếu trước/sau lỗi chữ thực tế.

## 3. Easing và chuyển động

**File:** `src/app/globals.css`, `src/components/site/journey-transition.css`, `src/components/motion/tokens.ts`.

- `--ease-in = cubic-bezier(0.4, 0, 1, 1)`: thoát, tăng tốc.
- `--ease-out` và `--ease-in-out` tham chiếu `--ui-ease = cubic-bezier(0.32, 0.72, 0, 1)` theo kế hoạch sửa. Hai tên này vẫn chia sẻ đường cong; ease-in đã tách riêng.
- Animation `journey-out` dùng `--ease-in`, thời lượng 250ms; `journey-in` dùng `--ui-ease`, 400ms.
- Token tương tác: hover 150ms, điều khiển 250ms, trang 400ms. Không sửa thời gian pha chơi hoặc đồng hồ game.
- Chế độ giảm chuyển động tắt animation chuyển trang và morph artwork.
- Outline My Class vẫn có choreography mở 260ms riêng; không tuyên bố mọi animation đều bị ép về ba thời lượng chung.

`SharedArtwork` nối các minh họa cùng tên giữa Mục lục và trang công khai tương ứng. Skeleton được thêm cho Giới thiệu, Mục lục, Liên hệ, khám phá khóa học, My Space và danh mục trò chơi.

## 4. Bìa khóa học theo slug

**File:** `src/config/courseArtwork.ts`, `src/components/learn/CourseArtwork.tsx`.

| Slug | Artwork |
| --- | --- |
| `hrm` | `human-growth-v1.webp` |
| `itm` | `business-systems-v1.webp` |
| Slug chưa khai báo | `human-growth-v1.webp` |

Map chỉ khai báo slug đã có trong các seed Learn hiện tại. Bốn loại artwork `ai`, `business`, `growth`, `project` sẵn sàng để bổ sung slug thật sau này. Không tạo slug mới hoặc migration.

Component chỉ nhận slug và className; không còn regex trên tiêu đề/category, nên đại từ tiếng Việt “ai” không thể quyết định artwork. LearnCourseCover giữ props tương thích và chuyển slug xuống component mới. Khóa chưa có trong map vẫn dùng fallback chung; cần bổ sung config khi một khóa mới có bìa riêng.

## 5. Cách giữ các thay đổi của PR #21 khi merge

Có 18 file sửa ở hai phía; Git yêu cầu xử lý trực tiếp chín xung đột. Các file còn lại được auto-merge và rà lại. Các quyết định chính:

| File/khu | Quyết định |
| --- | --- |
| `globals.css`, `my-class-theme.css` | Giữ các phần Teaching đã tách của main; thêm token chung và utility có tên riêng. Không phục hồi khối Teaching cũ đã bị main chuyển đi. |
| `TeachingCourseCards.tsx` | Giữ danh sách môn, thứ tự và trạng thái từ main; chỉ nâng nhãn nhỏ và dùng hệ icon/token tương thích. |
| `LearningExperienceWorkspace.module.css` | Giữ cấu trúc và cỡ chữ công việc của main; tích hợp thời lượng/token phù hợp. |
| `Dialog.tsx` | Giữ truyền `data-surface` vào dialog/portal; tích hợp thời lượng điều khiển 250ms. |
| `MySpaceGrid.tsx`, `content/mySpace.ts` | Giữ TeachingMark và màu teal ở My Space; dùng artwork mới cho các tile còn lại. |
| `muc-luc/*` | Giữ dấu hiệu Teaching của main ở tile tương ứng và minh họa công khai có shared transition. |
| `teaching/ui/styles/*` | Giữ bố cục bảng, trạng thái và palette; nối token radius/motion chung, nâng caption dưới 12px. Các hình dạng riêng trong component không bị xóa. |
| `scripts/areas/areas.mjs`, `.github/e2e-*.yml` | Đăng ký route khám phá và đồng bộ danh sách kiểm tra khu vực. |
| `docs/09-DESIGN_SYSTEM.md` | Giữ tài liệu Teaching của main; bổ sung phạm vi typography công khai và sửa mô tả token cũ. |

Các thay đổi nghiệp vụ/auth/deployment đi cùng main là thay đổi kế thừa qua merge, không phải tính năng mới của đợt UI này. Không sửa migration, luật trò chơi hoặc quy trình triển khai trong đợt sửa.

## 6. Những phần UI/UX được giữ lại

- Header công khai: wordmark DK + Duy Khánh, đường dẫn và tài khoản; giảm liên hệ trùng trên Mục lục, khám phá và 404.
- `/kham-pha-khoa-hoc` và alias `/khoa-hoc` là danh mục công khai. URL khóa cụ thể vẫn đi qua khu học và yêu cầu tài khoản.
- `src/features/learn/publicCatalog.ts` chỉ query `PUBLISHED`, chọn metadata, tên bài và số phút; không select markdown, câu hỏi, đáp án hoặc tiến độ. Integration test tạo cả draft và published fixture để xác nhận ranh giới dữ liệu.
- Hệ điều khiển SVG chung ở `src/components/ui/Icon.tsx`; adapter McIcon, LearnIcon, AdminIcon, StudioIcon giữ API ở từng khu. TeachingIcon, biểu đồ và hình game chuyên biệt giữ hệ riêng.
- ESLint chặn chữ tùy ý dưới 12px và hex trong TSX; pigment vector/biểu đồ được đưa vào config. Rule không phải một kiểm toán WCAG đầy đủ và không kiểm tra mọi giá trị CSS có thể biểu diễn.
- Wordmark, favicon, app icon, hero điện thoại, spot cho trạng thái và bìa được đồng bộ palette ochre/sage. Bản PNG gốc ngoài Git tại `../brand-masters/ui-ux-polish/`; provenance/prompt ở `public/brand/prompts.json`.
- Tạo bốn artwork My Space; sau merge, tile Teaching ở My Space dùng TeachingMark của PR #21, ba tile còn lại dùng artwork mới. Artwork Teaching mới vẫn được giữ trong bộ asset.

## 7. Asset và ảnh chia sẻ

17 raster mới/cập nhật đều dưới 300.000 bytes; lớn nhất 97.138 bytes. Script `scripts/check-brand-assets.mjs` kiểm tra diff với origin/main, kích thước icon và các endpoint OG.

| OG | Kích thước | Bytes |
| --- | --- | --- |
| Trang chủ | 1200 × 630 | 41.624 |
| Giới thiệu | 1200 × 630 | 47.728 |
| Khóa học | 1200 × 630 | 50.118 |
| Trò chơi | 1200 × 630 | 61.303 |

Chữ tiếng Việt trên OG dựng bằng font/code, không nhờ ảnh AI viết chữ. Mỗi OG dưới 150 KB.

**Chưa xóa chín asset cũ:** bốn `public/brand/myspace/*-v2.png`, ba `hero-figure.jpg`, `hero-landscape.jpg`, `hero-journey.jpg`, `myspace/my-class.svg`, `toc/experiences-v1.webp`. Đã hỏi chủ website theo bước 7 và AGENTS.md; chưa nhận phê duyệt. Ba hero JPG còn được liệt kê trong script export review cũ, nên phải cập nhật danh sách đó cùng commit cleanup nếu được đồng ý. Các asset không còn được giao diện sử dụng.

## 8. Kiểm chứng sau merge

| Kiểm tra | Kết quả |
| --- | --- |
| `npm run typecheck` | Đạt |
| `npm run lint -- --max-warnings=0` | Đạt |
| `npm run format:check` | Đạt |
| `npm run areas:check` | Đạt; 1.487 file nguồn |
| `npm run test:unit` | 812 kiểm tra; lint tooling 8; deploy tooling 11 |
| `npm run test:component` | 395 kiểm tra, gồm bốn hồi quy MainContent |
| `npm run test:integration` | 186 kiểm tra |
| `npm run build` | Đạt trên code sau merge và sửa |
| `node scripts/check-brand-assets.mjs http://localhost:3001` | Đạt 17 raster và bốn OG |
| E2E cuối | 96 kiểm tra đạt; Chromium và các phần mobile-smoke trên Chrome/Safari di động; không skip |

Sau khi bổ sung chờ điều khiển ổn định và xác nhận phase Ma Sói, chạy lại riêng năm kiểm tra phòng chơi: 5/5 đạt (`final-rooms.log`). Code ứng dụng không thay đổi sau lượt build/E2E cuối.

Lượt integration đầu thiếu `MONGODB_URI` tại thời điểm import; chạy lại với URI placeholder cục bộ, sau đó helper tạo MongoDB tạm. Kết quả 186 là lượt chạy hoàn chỉnh. E2E đầu phát hiện selector khớp tên một phần/nội dung ẩn và quyền clipboard gắn cứng cổng 3000; sửa selector để chỉ chọn nội dung hiển thị và cấp quyền đúng test origin, rồi chạy lại. Không thay `.last()` để che lỗi trùng.

Bộ E2E được chọn: `smoke`, `editorial-premium`, `mobile-smoke`, `public-feature-locks`, `legacy-links`, `my-class`, `my-class.admin`, `admin-workspace`, `teaching-admin-workspace`, `board-game-test-rooms`, `ui-ux-regression`. Chrome/Safari di động chạy phần mobile-smoke theo cấu hình dự án.

Phòng test dùng MongoDB tạm, bật kiểm tra isolated; cả Spyfall, Cheese Thief và Ma Sói chạy giao diện thật, đổi người chơi, tiến pha, tải lại và đóng phòng. Ma Sói được kiểm tra từ lobby sang dealt (chia bài), thao tác bot và tải lại; không gọi đây là chuỗi pha đêm/ngày vì sản phẩm Ma Sói hiện là phòng chia thẻ vai trò. Đây không phải kiểm chứng tải hoặc nhiều người chơi thật trên mạng production.

## 9. Ảnh và thao tác trình duyệt

Tất cả bằng chứng ở `/Users/duykhanh/Workspace/Active/ui-ux-review/` ngoài Git.

- `before/`: Mục lục, khám phá, bảng admin, mỗi trang ở 375px và 1440px, từ build trước đợt sửa/main merge.
- `after/`: cùng trang/kích thước từ bản build sau sửa; thêm ảnh phòng Ma Sói sau bước chuyển pha.
- `baseline-e2e.log`: hai kiểm tra admin thất bại với 15px; public đạt. Đây là phép thử trên bản cũ để chứng minh lỗi, không phải một lỗi còn tồn tại trên nhánh mới.
- `final-e2e.log`, `final-rooms.log`, `final-unit.log`, `final-component.log`, `final-integration.log`, `final-build.log`, `final-assets.log`: kết quả cuối theo từng nhóm.
- Kiểm tra tay trong browser pane: Mục lục/khám phá ở 375/1440px, mở chương trình khóa minh họa, bấm Bắt đầu học và xác nhận chuyển tới đăng nhập.
- Ảnh bảng admin và phòng chơi lấy trong E2E với session fixture; không gọi đó là đăng nhập Google thật hoặc kiểm tra tay trên tài khoản thật.
- Không có ảnh unit My Class hoạt động trước/sau: URL learner bị archive 404. Không dùng ảnh giả để thay bằng chứng thiếu này.

Hai khóa Learn minh họa ghi rõ “Minh họa kiểm thử”, chỉ tạo trên DB test để chụp bìa/chương trình; đã xóa sau QA. Seed My Class mẫu được giữ trên DB test cho việc kiểm tra authoring; không áp seed lên production.

## 10. Commit để expert rà riêng

| Commit | Mục đích |
| --- | --- |
| `b4ee25d` | Merge main hiện tại, giải quyết xung đột |
| `0580b8e` | Di chuyển renderer McIcon sang ui/Icon; adapter đường dẫn cũ |
| `b6a086c` | Token và guard lint |
| `d450efa` | Asset/nhận diện/OG |
| `c146eb9` | Chuẩn hóa điều khiển, màu và caption nhỏ |
| `194a9c5` | Sửa remount, chuyển động công khai và skeleton; regression test |
| `eef094a` | Danh mục khóa công khai, map slug và đăng ký route |
| `d710588` | Điều hướng và các trang editorial |
| `cf3dc8a` | E2E các hợp đồng công khai mới |
| `184bbb2` | Token typography trong Mục lục |
| `0fde195` | E2E mật độ chữ, nội bộ và bằng chứng ảnh |
| `33d1dd2` | Xác nhận phase Ma Sói và chụp khi điều khiển ổn định |
| Commit docs cuối | Hồ sơ này và tài liệu design system |

Renderer gốc đã đúng định dạng Prettier, nên không tạo một commit `style:` rỗng. Commit di chuyển đứng riêng trước commit mở rộng renderer/thay nơi sử dụng. Giữ adapter cũ để tránh thay API ở hàng loạt khu trong commit di chuyển. Thứ tự asset trước các component tiêu thụ giúp từng bước có dependency hợp lệ.

Snapshot an toàn `f15a0c3` trước merge vẫn được giữ trong Git stash; không áp lại snapshot cũ lên nhánh đã tích hợp main.

## 11. Giới hạn còn lại

- Chín asset cũ chờ phê duyệt xóa; không thuộc commit cleanup nào hiện tại.
- Chưa thể đi qua ba unit My Class thật do archive ở main. Regression component xác nhận MainContent không gây remount; chưa xác nhận toàn bộ logic scroll/outline của learner trên browser.
- Chưa đăng nhập Google thật, gửi lời nhắn ra ngoài, kiểm tra tải nhiều người chơi hoặc chạy toàn bộ tất cả E2E trong repository. Bộ chọn ở trên bao phủ các phần được yêu cầu rà trong lượt sửa này; CI của shared code vẫn cần chạy khi sau này mở PR.
- Không tuyên bố đã chứng nhận WCAG hay “chuẩn quốc tế” bằng một bộ test tự động. Ảnh review và kiểm tra tương tác là bằng chứng để expert đánh giá tiếp.
