# Learn Studio: kế hoạch đã đối chiếu với phiên bản hiện tại

Ngày rà soát: 07/10/2026. Nền đối chiếu: `origin/main` tại `e9e4b4f`.

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
9. Dùng token `.ln`, focus có thể nhìn thấy, reduced motion, label thật và LiveRegion. Không thêm dependency hoặc migration cho việc bảo trì này.
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
