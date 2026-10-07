# Rà soát kế hoạch và các nhánh chưa deploy

Ngày rà soát: 07/10/2026. Nhánh tổng hợp: `codex/finish-pending-work`.

## Kết quả

Các thay đổi còn phù hợp đã được hợp nhất và sửa cho kiến trúc hiện hành: mục lục hai cửa, UX Cheese Thief, tốc độ đọc Learn và parser phản biện. Kế hoạch Learn Studio đã đối chiếu với code thật. Case Study bị loại khỏi phạm vi theo yêu cầu mới; đã xóa cả hai bản kế hoạch ở checkout chính và worktree tổng hợp, chưa tạo model, route hay migration.

Nhánh tổng hợp xuất phát từ `origin/main` tại `e9e4b4febcdb1dae626ff428bcf4d70c89a34914`. Main và VPS cùng SHA này: release `e9e4b4febcdb-37555680367-1`, xác nhận trực tiếp bằng symlink `current` và `.deploy-metadata`. [Workflow deploy #37555680367](https://github.com/khanhnd2208/webofficial/actions/runs/37555680367) đã thành công. Tại thời điểm chốt kiểm chứng local, các thay đổi tổng hợp chưa push, mở PR, merge hay deploy. Người dùng đã yêu cầu hoàn tất shipping sau đó; trạng thái thực tế được theo dõi qua PR của nhánh này và workflow CI/deploy, thay vì suy ra từ ảnh chụp trạng thái local trong báo cáo.

## Quyết định cho từng nhánh

| Nhánh hoặc tài liệu | Revision nguồn | Kết quả rà soát và xử lý |
| --- | --- | --- |
| `claude/toc-doors` | `5261a56`, `29d9bda` | Merge vào nhánh tổng hợp; sửa conflict để giữ design token, header và route khám phá khóa học hiện tại. Giữ no-JS, modified click, hash, Back, Escape và focus. |
| `origin/claude/cheese-thief-game-ux-fwiydi` | `e7e3870`, `40eeb56` | Merge vào nhánh tổng hợp; chuyển shared imports sang board-game-shared, dùng semantic colors thật và giữ luật một đêm/một số. Pha bí mật đợi mọi người xác nhận; cập nhật bot runner, test controls và E2E tương ứng. |
| `origin/claude/course-reading-performance-efo166` | `c74e118` | Chuyển phần còn hữu ích sang code mới: formatter nhẹ, phản hồi điều hướng, khóa nút completion khi API chưa xong, lazy Markdown và Mermaid gần viewport. Không lấy lại Quiz/Practice đã nghỉ. Nhánh nguồn được thay thế bởi phần port trong nhánh tổng hợp. |
| `origin/cursor/itm-bai-1-phan-bien-caac`, draft PR #3 | `a14624f` | Chuyển parser nhận nhãn có hậu tố và test hồi quy. Giữ nội dung ITM đã audit mới hơn trên main. Không lấy thay đổi seed ghi đè nội dung hiện có. PR nháp chưa được đóng hay sửa. |
| `claude/deploy-prune-fallback` | `c8aac2e`, PR #35 đã đóng | Thay thế bởi PR #36 (`05c6816`) đã trên main: cài runtime với `HUSKY=0 npm ci --omit=dev`. Không đưa lại bản deploy cũ. |
| `codex/current-version-review` | `994a7d3` | Phần hữu ích đã được port qua `b273a94` và các thay đổi tiếp theo trên main. Không merge cả kiến trúc cũ trở lại. |
| `origin/agent/personal-brand-restructure` | `6361a0c`, `6e59daf` | Bản tháng 7 đã được thay thế bởi kiến trúc thương hiệu hiện tại. Không phục hồi route, nội dung hoặc giao diện cũ. |
| `claude/learn-studio-ux`, `cursor/learn-studio-ux` | `bc05a9d`, `5d9cc80` | Các commits đã là tổ tiên của main; đối chiếu tính năng thực tế trong kế hoạch Learn, không merge lại. |
| `claude/faster-deploy`, `cursor/cheese-one-night`, `cursor/public-design-tokens`, `claude/learn-reading-discussion-only`, `codex/audit-itm-hrm-content` | `6031eca`, `f886548`, `f4d45f6`, `d8923a5`, `2f1eca0` | Đã merge main và deploy; giữ làm nền, không ghi đè bằng bản cũ. |
| `docs/plans/learn-studio-ux.md` | Bản untracked ở checkout chính | Viết bản đã rà soát trong worktree tổng hợp: trạng thái từng nhóm, hợp đồng lưu/conflict/snapshot/undo, tiêu chí đóng kế hoạch và giới hạn shipping. Bản gốc checkout chính được giữ nguyên. |
| `docs/plans/case-study-ndk.md` | Hai bản kế hoạch chưa commit | Đã xóa theo yêu cầu. Không còn kế hoạch triển khai hay yêu cầu migration Case Study. Giữ redirect cũ vốn đã trên main để URL đã chia sẻ vẫn hoạt động. |

Các nhánh backup và worktree của phiên làm việc khác được giữ nguyên. Những nhánh cũ ghi “thay thế” không cần merge lại vào main: việc Git vẫn liệt kê chúng là chưa merge không đồng nghĩa còn tính năng cần deploy.

## Những lỗi tích hợp đã sửa

- Các screen Cheese Thief cũ tham chiếu trường hai đêm và module shared đã chuyển chỗ. Chỉ dùng DTO một đêm hiện hành; không phục hồi trường legacy.
- Secret không còn timer nhưng phòng test vẫn thử bỏ qua 61 giây. Bỏ thao tác đó, chỉ hiện nút skip ở pha night; test runoff gửi lựa chọn và xác nhận thật.
- Giao diện bí mật có class màu không còn khai báo. Thay bằng token có hiệu lực và kiểm tra ảnh mobile.
- Nút hoàn thành Learn từng đổi thành link trước khi lưu tiến độ xong. Giữ trạng thái busy, chặn gửi lặp, khôi phục trạng thái trước đó khi lỗi và điều hướng sau khi lưu. Làm mới dữ liệu tiến độ đã tải trước; reset control theo mục và trạng thái hoàn thành để desktop/mobile không giữ trạng thái của bài trước hoặc bản ẩn chưa cập nhật.
- Mermaid tránh render hàng loạt ngoài viewport, tuần tự hóa cấu hình global, cache tối đa 64 SVG và tránh dùng lại ID giữa các instance. Khi source/theme đổi, không hiển thị kết quả cũ.
- Đáp án phản biện tải lazy: kiểm thử chờ nội dung thực sự xuất hiện; catalog dùng formatter không kéo content schema vào client.
- E2E mục lục dùng selector của cấu trúc hai cửa, giữ header và route của main hiện tại. CI chạy thêm bộ Learn reader mới và operating-focus đã sửa, không chỉ đăng ký trong area map.
- URL alias `/khoa-hoc` từng bị nhận nhầm là reader nên thiếu public header khi có khóa học. Cho catalog alias và `/kham-pha-khoa-hoc` cùng header/breadcrumb; giữ reader và Studio không public header. Kiểm thử legacy dùng điều hướng luôn có, không giả định catalog rỗng.

## Kiểm chứng đã chạy

| Kiểm tra | Kết quả |
| --- | --- |
| `npm ci` | Thành công; không thêm dependency hay đổi lockfile |
| `npm run typecheck` | Qua, bao gồm các hooks commit |
| `npm run lint -- --max-warnings=0` | Qua |
| `npm run format:check` | Qua |
| `npm run areas:check` | Qua: 4 areas, 1496 source files |
| `npm run test:unit` | Qua: 134 files / 821 tests; lint tooling 8 tests và deploy tooling 12 tests cũng qua |
| `npm run test:component` | Qua: 98 files / 445 tests |
| `npm run test:integration` | Qua toàn bộ: 23 files / 186 tests, PostgreSQL và MongoDB test riêng; có kiểm tra hai người xác nhận bí mật đồng thời |
| `npm run build` | Qua: Next.js 16.3.6, Webpack, 118 trang static; không bỏ typecheck |
| Public/menu/game/operating-focus/Learn E2E | Qua đủ 69 tests trên bản production cuối `ac2c651`, Desktop Chromium + Android + Safari mobile; gồm cả 6 ca cần PostgreSQL trước đó và 3 ca Learn mới |
| Learn reader E2E | Qua 3/3 trên production: API chậm ở desktop/mobile, tiến độ sau chuyển bài và bỏ đánh dấu, đổi bố cục, Mermaid thật gần viewport; đã tính trong 69 ca phía trên |
| E2E phòng game trên `scripts/board-game-test-server.mjs` | Qua: 6 tests, MongoDB ephemeral riêng, thực hiện chuyển ghế, reload, quyền truy cập, vòng một đêm, pha bí mật và hướng dẫn hai ngôn ngữ |
| `git diff --check`, `git ls-files -u`, tìm conflict markers | Qua, không còn conflict chưa resolve |
| `git merge-tree --write-tree --no-messages origin/main HEAD` | Qua với main `e9e4b4f`; merge thử không đổi checkout |

### Giới hạn kiểm chứng

Đã đóng khoảng trống PostgreSQL: khởi tạo PostgreSQL 18.3 ở loopback `127.0.0.1:55439`, tách database integration và trình duyệt. Database test dùng đủ 60 file SQL migration hiện có, bao gồm constraint/trigger; không tạo hay sửa migration. Toàn bộ integration đã qua. Sáu ca E2E trước đó lỗi `DatabaseNotReachable`/`P1001` đã chạy lại thành công trong bộ 69 ca trên bản production local cuối. Không còn bỏ qua ca database vì thiếu PostgreSQL.

GitHub CI chưa chạy tại thời điểm kiểm chứng local; shipping phải đợi các checks của PR và main thành công. CI dùng PostgreSQL 16, local dùng 18.3; trước merge vẫn cần CI xanh trên đúng commit. Các dịch vụ/database test là môi trường tạm riêng, không dùng database production.

Không thay Prisma schema/migration, dependency, nội dung nguồn Learn đã audit hoặc seed production. Không ghi database production. Merge không conflict Git là kết quả tại revision được ghi trong báo cáo; nếu main đổi cần fetch và kiểm tra lại.

### Ảnh QA local

Đã kiểm tra bố cục desktop/mobile, cửa đóng/mở, screen bí mật, luồng học và catalog alias tại `/private/tmp/pending-work-review/`. Các ảnh không đưa vào `public/` hay commit:

- `toc-1440-closed.png`, `toc-1440-open.png`.
- `toc-390-closed.png`, `toc-390-open.png`.
- `cheese-secret-390.png`: ảnh giao diện người chơi, tạm ẩn bảng điều khiển admin test khi chụp.
- `learn-saving-1440.png`, `learn-saving-390.png`, `learn-next-1440.png`, `learn-next-390.png`, `learn-mermaid.png`: trạng thái đang lưu, bài tiếp và sơ đồ trên browser thật.
- `course-catalog-alias-1440.png`, `course-catalog-alias-390.png`: header URL catalog cũ đúng trên cả desktop/mobile, không tràn ngang.

## Bước tiếp theo

1. Dùng nhánh `codex/finish-pending-work` cho PR tổng hợp; không merge lại các nhánh nguồn đã được port hoặc thay thế.
2. Khi được yêu cầu shipping, chạy lại kiểm tra trên main mới nhất, xác minh CI cho đúng commit rồi mở PR. Merge bằng merge commit khi người dùng cho phép.
3. Chỉ sau khi merge đã được yêu cầu mới theo dõi workflow deploy. Chỉ coi shipping hoàn tất khi workflow deploy thành công và VPS xác nhận đúng SHA sau merge.

Checkout chính vẫn ở `b137c53`, chậm hơn `origin/main` 170 commits và còn bản Learn plan untracked. Không fast-forward, stash hay sửa công việc đó. Ngoại lệ duy nhất là xóa Case Study theo yêu cầu rõ ràng của người dùng.
