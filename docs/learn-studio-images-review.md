# Learn Studio: ảnh và UX soạn bài

Ngày rà soát: 04/10/2026. Phạm vi: plan sửa ảnh dán/nhập và các popover trong Learn Studio.

## Kết quả rà soát và thay đổi

| Luồng | Vấn đề trước đây | Hành vi sau sửa |
| --- | --- | --- |
| Nhập Markdown/AI | Tên ảnh tương đối trở thành ảnh vỡ, không có hướng xử lý | Hiện khung chờ và tên file; chọn nhiều ảnh để ghép theo basename, không phân biệt hoa/thường hay đuôi PNG/JPG |
| Ghép ảnh hàng loạt | Phải thay từng ảnh | Chọn nhiều file hoặc thả thư mục; đọc hết các trang directory entries, ghép các nguồn chưa sẵn sàng, báo file không khớp; file trùng khóa không ghi đè ngẫu nhiên |
| Dán ảnh clipboard | Chỉ nhận ảnh đầu | Nhận đủ file; tạo vị trí chờ ngay, thay URL khi upload xong, giữ thứ tự dù upload hoàn tất khác thứ tự |
| Dán HTML có chữ và ảnh | Word đính kèm ảnh chụp toàn vùng chọn; file/data URL vỡ hoặc biến mất | Giữ HTML chữ, bỏ qua ảnh chụp đính kèm; xử lý riêng các ảnh trong HTML; ảnh data tự tải lên, file URL thành khung chờ |
| Dán/thả ở tab Markdown | Không có cách chèn ảnh | Chèn cú pháp ảnh tại vùng chọn/con trỏ; thay đúng nguồn chờ khi upload xong, giữ các chỉnh sửa phát sinh trong lúc tải |
| Thả ảnh trong soạn trực quan | Chèn tại con trỏ cũ | Dùng vị trí thả; kéo node đang có vẫn dùng hành vi của Tiptap |
| Trạng thái upload | Một dòng chung, không rõ file lỗi | Hàng đợi tối đa ba lượt upload đồng thời, tiến độ và lỗi kèm tên file, có nút đóng lỗi |
| Trang học viên | Render ảnh thiếu và biểu tượng vỡ | Bỏ ảnh nguồn chưa sẵn sàng; ẩn toàn bộ figure khi ảnh tải lỗi; giữ khung chờ riêng trong preview Studio |
| Xuất bản | Không kiểm tra ảnh | Mục lục đánh dấu mục cần bổ sung ảnh; hộp xác nhận liệt kê các mục, có Đi tới mục và Vẫn xuất bản |
| Chuyển về nháp | Ẩn khóa học ngay | Hỏi xác nhận vì khóa học sẽ bị ẩn với học viên |
| Chèn liên kết/khối học thuật | Không có Hủy/Escape; menu mất khi chuột rời | Hủy, Escape và click ra ngoài; các lựa chọn khối vẫn dùng được bằng Tab/Enter |
| HTML trang đọc | Figure nằm trong paragraph | Dùng block wrapper cho đoạn có ảnh, tránh cấu trúc HTML gây lỗi hydration; nút phóng to có tên truy cập kể cả khi alt trống |

Upload tiếp tục dùng `/api/uploads` và các giới hạn/kiểm tra ảnh của API hiện có. Không thêm thư viện, migration hay dữ liệu mẫu vào ứng dụng.

Ảnh data được giải mã tại trình duyệt, tránh phụ thuộc fetch bị CSP chặn. `connect-src` cho phép thêm `blob:` để đọc ảnh clipboard cục bộ; không thêm host mạng ngoài. Việc tự lấy ảnh HTTP ngoài chỉ là best effort: CORS/CSP có thể chặn, khi đó giữ cảnh báo ảnh ngoài và cho tải file thay thế. Googleusercontent hiện đã được cho phép ở `img-src`, nên không phải mọi ảnh Google Docs đều bị chặn; nguồn ngoài vẫn nên chuyển thành upload để ổn định.

## Kiểm tra

Đã chạy typecheck, lint không warning, format:check, areas:check, unit tests, component tests và production build. Build cần các giá trị môi trường giả lập giống CI vì worktree mới không có `.env.local`; không dùng cấu hình database production.

Test bổ sung bao phủ phân loại nguồn, giữ alt/title/width, bỏ qua ví dụ trong code, hàng đợi ba lượt tải, thứ tự/vị trí chèn, data/file HTML, directory entries phân trang, ghép tên và file không khớp, Nhập AI, khung chờ, ảnh lỗi ở trang đọc, cấu trúc HTML, xác nhận xuất bản/nháp và popover.

Kiểm tra trình duyệt dùng các component thật trong trang thử local với API giả lập: khung chờ, chọn ảnh ghép tên, Nhập AI, cảnh báo xuất bản, dán ảnh clipboard vào Markdown, dán HTML có data/file URL và xuất Markdown không chứa base64. Screenshot giữ ngoài repo. Đây là kiểm tra UI, chưa xác minh trọn luồng đăng nhập admin thật, API upload thật hay clipboard riêng của ứng dụng Word/Google Docs. Thả thư mục và thứ tự upload còn được kiểm tra tự động.

Không chạy integration tests vì không đổi services, repositories, models hay API routes. Không deploy, push hoặc mở PR.

## Các điểm giữ lại cho lần sau theo plan

- Chưa có lịch sử phiên bản hoặc khôi phục nội dung.
- Xóa bài/mục vẫn dùng hộp xác nhận mặc định của trình duyệt.
- Chưa có chế độ preview theo khổ điện thoại.

Cảnh báo trước xuất bản kiểm tra nguồn ảnh trong nội dung, không kiểm tra sự tồn tại của mọi URL upload trên máy chủ. Ảnh URL hợp lệ nhưng file đã mất được phát hiện khi trình duyệt tải ảnh và được ẩn ở trang học viên.
