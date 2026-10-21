# Learn Studio: kế hoạch đã đối chiếu với phiên bản hiện tại

Ngày rà soát: 07/10/2026. Nền đối chiếu: `origin/main` tại `bae22dd`.

## Phạm vi hiện hành

Learn chỉ có bài đọc (`READING`) và câu hỏi phản biện (`DISCUSSION`). PR #26 đã đưa các cải tiến Studio lên main; PR #34 đã bỏ quiz và luyện tập khỏi giao diện. Không triển khai lại PR Quiz của bản kế hoạch trước và không phục hồi hệ Chương–Bài đã lưu trữ.

## Kết quả đối chiếu

| Nhóm việc của kế hoạch cũ | Bằng chứng trong code hiện tại | Kết luận |
| --- | --- | --- |
| Lưu an toàn, retry, giữ lỗi field | `studio/useStudioSaver.ts`, `saveErrors.ts`, `sectionPatch.ts`, các test tương ứng | Đã có; giữ hợp đồng `flush(): Promise<{ ok: boolean }>` |
| Dialog, toast, undo khi xóa | `StudioConfirm.tsx`, `StudioToast.tsx`, `useDeferredDeletes.tsx` và test DELETE trước PUT | Đã có |
| Conflict khi hai tab cùng sửa | `baseUpdatedAt` trong schema/service, `ConflictDialog.tsx`, `service.conflict.unit.test.ts` | Đã có |
| Snapshot và lịch sử | `sectionRevisions.ts`, `RevisionDialog.tsx`, `TextDiff.tsx`, admin revision API | Đã có; không đưa markdown vào response danh sách revision |
| Soạn phản biện và preview cùng học viên | `LearnDiscussionEditor.tsx` dùng editor trực quan, ba tab Đề bài / Đáp án mẫu / Xem trước; `DiscussionQuestionCard.tsx` | Danh sách câu nằm trong sidebar, không chia cột trong editor |
| Quiz, luyện tập, checkpoint | Không còn trên DTO, Studio, trang học, nhập và xuất. Cột database giữ lại. Khôi phục phiên bản không đưa checkpoint hay quiz trở lại | Đã đóng các đường còn sót |
| Publish checklist và xuất Markdown | `publishChecklist.ts`, `PublishDialog.tsx`, `exportMarkdown.ts` và các test | Đã có; kiểm tra READING/DISCUSSION |
| Quản lý khóa và lastEditedAt | `adminCatalog.ts`, `search.ts`, `LearnCourseAdminList.tsx` | Đã có; `lastEditedAt` lấy max của khóa, bài và mục |
| Responsive, loading, phím tắt | Sidebar 16rem từ 1024px; thuộc tính là drawer; dưới 1024px mục lục mở bằng drawer. `SectionJumpDialog.tsx`, `useStudioShortcuts.ts` | Đã có |
| Tối ưu đọc bài còn trên nhánh cũ | Tách `format.ts`, phản hồi điều hướng, khóa completion lúc lưu, cập nhật tiến độ và control desktop/mobile theo bài, Mermaid gần viewport | Đã chuyển vào nhánh hoàn thiện; kiểm tra cùng Studio |
| Parser nhãn phản biện có hậu tố | `splitLabelled` nhận `Kết luận (a):` và `Cùng suy nghĩ từng bước — phần (a):` | Đã chuyển phần còn hữu ích từ PR nháp #3 |

## Hợp đồng cần giữ khi bảo trì

1. Client nhận `updatedAt` sau mọi write và cập nhật version map. `baseUpdatedAt` phải tách khỏi dữ liệu Prisma; không tự ghi đè khi 409.
2. Lỗi mạng/5xx retry theo backoff; lỗi validation giữ field sai đến khi đổi giá trị. `flush()` không chờ hết chuỗi retry để trả lời điều hướng.
3. Chuyển trang, nhập, xuất và mở trang học chỉ chạy sau `flush().ok === true`. Modified click vẫn mở tab bình thường.
4. Reorder giữ `updatedAt` cũ của mục; đổi vị trí không được tạo conflict giả cho người đang sửa nội dung.
5. Giữ bản của tôi khi conflict cần snapshot bản server rồi ghi với version vừa đọc. Tải bản server cần cập nhật editor và version map.
6. Hoàn tác xóa câu sửa JSON cục bộ; không phát sinh DELETE riêng. Hoàn tác xóa mục giữ hàng đợi 8 giây; thao tác cấu trúc phải commit hàng đợi trước PUT outline.
7. Preview phản biện dùng cùng card học viên, không lưu tiến độ, không localStorage và không gọi API học viên.
8. Export chỉ thực hiện sau flush thành công; tránh xuất một trạng thái khác với nội dung đang thấy.
9. Dùng theme Admin dùng chung cho Studio, token `.ln` riêng cho preview học viên, focus có thể nhìn thấy, reduced motion, label thật và LiveRegion. Không thêm dependency hoặc migration cho việc bảo trì này.
10. Nội dung ITM hiện tại đã được audit sau PR nháp #3. Không thay bằng bản cũ chỉ để hết conflict. Seed chỉ tạo dữ liệu còn thiếu; chỉnh production qua Studio/admin API.

## Tiêu chí đóng kế hoạch

- Unit, component, lint, typecheck, format và areas qua trên nhánh hợp nhất.
- Toàn bộ integration đã qua trên PostgreSQL/MongoDB test riêng, gồm kiểm thử conflict, snapshot và xác nhận game đồng thời.
- Kiểm tra người dùng: completion chờ API chậm, không gửi lặp, cập nhật tiến độ và nút bài tiếp trên desktop/mobile; bỏ đánh dấu rồi đổi bố cục vẫn đúng. Studio giữ bản chưa lưu và hỏi trước khi rời.
- Mermaid chưa gần viewport không tải/render; đổi source không hiện sơ đồ cũ; lỗi hiện source hiện tại.
- Không còn đường tạo quiz/luyện tập từ Studio và không phục hồi route đã nghỉ.
- Ghi kết quả thực tế trong `pending-work-review.md`; tách trạng thái local, PR, merge và deploy.

## Giao hàng

Commit từng loại thay đổi riêng. Trước push chạy các gates trong AGENTS.md. Push/PR/merge/deploy chỉ khi người dùng yêu cầu bước đó trong cuộc trò chuyện; merge dùng merge commit. Không chỉnh checkout chính hoặc xóa nhánh/worktree của người khác trong quá trình hoàn thiện.


## Rà soát nhánh chuẩn hóa Studio — 07/10/2026

Nhánh `cursor/learn-studio-admin` có commit chuẩn hóa ban đầu `b545ba8`. Rà soát bổ sung đã sửa:

- Nội dung editor trực quan đang chờ debounce bị mất hoặc ghi đè danh sách khi thêm, nhân bản, đổi thứ tự và xóa câu. Thao tác cấu trúc giờ flush editor, đọc draft mới nhất; xóa cập nhật JSON ngay và undo không làm mất phần sửa tiếp theo.
- Undo và câu đang chọn được giới hạn theo mục/phiên khôi phục; xóa câu cuối không giữ editor của câu đã xóa.
- Studio dùng theme Admin chung; preview giữ theme học viên. Drawer mục lục/thuộc tính của đợt này đã được thay bằng một mặt soạn (mục 19/10/2026).
- Breakpoint dùng snapshot SSR nhất quán để tránh hydration mismatch trên desktop.
- Mọi chế độ nhập đều chặn áp dụng nếu lưu bản đang sửa thất bại. Xuất và khôi phục bài đọc loại các khối luyện tập đã nghỉ; nội dung không liên quan, kể cả dòng trống trong code block, được giữ nguyên.

Kiểm tra local: typecheck, lint không warning, format, areas, build; 830 unit, 452 component, 188 integration. Sáu hành trình Playwright kiểm tra soạn/chuyển câu, nhập thực sự qua ba bước, lưu/khôi phục, nhân bản/xóa với draft mới nhất, focus drawer và bố cục ở 390/768/1024/1280/1440/1920px. E2E chỉ chạy localhost trên database test riêng.

Không có dependency hay migration mới. Chưa chỉnh nội dung đang chạy trên production: các đoạn luyện tập nằm trong Markdown bài giảng cũ phải đọc lại, lưu phiên bản và PATCH phần khác biệt qua Studio/admin session; không dùng seed hay ghi database trực tiếp.

## Giao diện soạn — 19/10/2026

Một mặt soạn: mục lục, nội dung và thông tin mục. Từ 64rem trở lên cả ba hiện cùng lúc. Dưới mức đó, tab Mục lục / Nội dung / Thông tin chuyển vùng; dòng “Đang sửa” luôn nêu bài và mục đang mở. Drawer mục lục và thuộc tính không còn.

“Xem như học viên” nằm trên thanh trên. Lưu vẫn hiện Đang lưu, Đã lưu, mất kết nối (kèm Thử lại ngay) hoặc lỗi cần sửa. Khóa công khai ghi rõ: lưu thành công thì học viên thấy nội dung mới.

Mô tả khóa hiện ở phần Giới thiệu trên trang tổng quan, không phải đầu mục đầu tiên. Thời lượng, tóm tắt và ý chính nằm trong nhóm “Hiện với học viên”, kèm chỗ chúng xuất hiện trên trang học.

Hộp nhập tên là “Nhập nội dung”. Ô dán nhận Markdown hoặc câu phản biện. Đích, cách nhập (tạo mới, thêm, thay) và số mục/câu bị ảnh hưởng hiện trước khi lưu. Thay thế làm mất mục hoặc câu phải xác nhận, kèm tên mục hoặc số câu. Hướng dẫn đưa prompt cho AI nằm trong “Dùng AI để định dạng (tùy chọn)”.

Nhập thay thế, xem trước, xuất Markdown và xuất bản gọi `commitAll()` rồi mới `flush()`. `commitAll()` chờ cả mục đang trong cửa sổ hoàn tác lẫn DELETE đã gửi nhưng chưa xong. DELETE lỗi thì mục được đưa lại vào mục lục, Studio báo lỗi cụ thể, và thao tác phụ thuộc dừng: nhập không ghi, xuất không tải file, xuất bản không mở hộp thoại, xem trước đóng tab trống thay vì mở trang học viên. Lưu chữ bị lỗi hoặc mất mạng thì giữ bản đang gõ và thử lại được; xem trước không mở bản cũ như thể đã lưu. Hai phiên sửa cùng một mục thì hiện hộp xung đột, không ghi đè im lặng.

Trên màn hẹp, tab Mục lục / Nội dung / Thông tin gắn với vùng nội dung bằng `id`, `aria-controls`, `role="tabpanel"` và `aria-labelledby`. Đổi tab chỉ ẩn vùng kia. Ô soạn vẫn nằm trên trang, nên chữ vừa gõ còn khi quay lại hoặc khi cửa sổ vượt mốc 64rem.

Hợp đồng `flush()` vẫn là `Promise<{ ok: boolean }>`. Không thêm dependency, migration hay API công khai.

Đã gỡ CSS quiz/phương án và drawer không còn phần tử nào dùng. Không đụng dữ liệu bài giảng, quản lý lớp hay bộ thẻ ôn tập. Phần dư được dọn trong phạm vi đã kiểm tra bên dưới; điều đó không có nghĩa toàn bộ Studio đã hết vấn đề. Production chưa được mở trong đợt sửa — sau khi triển khai vẫn cần smoke test trên site đang chạy.

### Đã chạy

- `npm run typecheck`, `npm run lint -- --max-warnings=0`, `npm run format:check`, `npm run areas:check`: đạt.
- `npm run test:unit`: 780. `npm run test:component`: 472.
- `npm run build`: đạt.
- Playwright `e2e/learn-studio.spec.ts` (chromium, server local, database test): 11 đạt. Gồm xóa bài mặc định rồi thêm bài từ giao diện, gõ bài đọc và câu phản biện rồi đổi tab/đổi cỡ cửa sổ/lưu/tải lại, và soạn được ở 1024px cùng viewport 512px (tương đương phóng 200% trên cửa sổ 1024px).

### Đọc từ mã

- `commitAll()` giữ Promise của DELETE đang chạy. Lần gọi chồng lên nhau phải chờ DELETE đó. Xóa mục khác khi mục trước chưa xong thì mục trước vẫn được gửi và lỗi của nó không thành Promise bị bỏ quên.
- DELETE lỗi thì `restore()` đưa mục lại, `setActionError` nêu lỗi và câu “hãy thử xóa lại”, rồi ném `StudioDeleteError`. Nhập nhận lỗi đó. Xem trước, xuất và xuất bản nhận `{ ok: false }` và không đi tiếp.
- Tab vùng soạn có `id` và `aria-controls`. Vùng tương ứng có `role="tabpanel"` và `aria-labelledby` khi đang ở layout hẹp. Ba vùng vẫn mounted; tab không chọn chỉ bị `hidden`.

### Chưa xác minh ở đây

- `npm run test:integration`: không chạy, vì không đổi API, service hay schema.
- Toàn bộ Studio ngoài các ca ở trên.
- Site production. Smoke test sau triển khai vẫn cần: mở một khóa, xóa thử một mục rồi hoàn tác hoặc để lỗi mạng, đổi tab trên điện thoại, lưu và tải lại.


## Rà soát luồng Markdown — 22/10/2026

- Bài đọc và lời dẫn mở sẵn Markdown, kèm xem trước; vẫn có thể chuyển sang soạn trực quan với kiểm tra mất nội dung.
- Nhập bài chấp nhận `# Tên bài`, `## Tên mục`. Không cảnh báo chỉ vì dùng tiêu đề Markdown chuẩn. Mẫu SECTION vẫn dùng được.
- Dùng `![Mô tả]()` hoặc `![Mô tả](ten-anh.png)` để đánh dấu chỗ cần ảnh. Mỗi vị trí có nút chọn file bất kỳ, độc lập với các vị trí trống khác. Ghép nhiều ảnh theo tên vẫn có sẵn.
- Ảnh nội bộ không tải được cũng được báo trong danh sách bổ sung. Đây là kiểm tra tải ảnh trong trình duyệt, không suy đoán đoạn văn nào cần minh họa khi chưa có ký hiệu ảnh.
- Upload giữ chỗ trước khi chờ máy chủ; sửa chữ/xóa ảnh trong lúc tải không làm ảnh gắn nhầm. Thất bại trả lại chỗ trống để thử lại.
- Bỏ danh sách đường dẫn ảnh lặp; gộp các nút chèn định dạng vào menu. Nút tìm bài/mục hiện rõ ở mục lục, hỗ trợ tìm không dấu.
- Kiểm tra trình duyệt bao gồm nhập Markdown, upload thật, sửa, lưu, tải lại và màn hình điện thoại; dùng dữ liệu thử cục bộ.
