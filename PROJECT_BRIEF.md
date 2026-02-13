# MÔ TẢ DỰ ÁN: NỀN TẢNG GIÁO DỤC & THƯƠNG HIỆU CÁ NHÂN

**Người sở hữu:** Giảng viên (Product Owner)

## 1. Tầm nhìn & Mục tiêu (Vision)

Tôi muốn xây dựng một "ngôi nhà số" (Digital Hub) chuyên nghiệp.

* **Ngắn hạn:** Là nơi tôi chia sẻ kiến thức chuyên môn (Blog) và là công cụ để sinh viên hiện tại của tôi đăng nhập vào xem điểm số, bài tập một cách riêng tư.
* **Dài hạn:** Phát triển thành một nền tảng E-learning (bán khóa học, video, trắc nghiệm online) phục vụ hàng ngàn học viên.

## 2. Đối tượng sử dụng (User Personas)

Hệ thống phục vụ 3 nhóm người dùng chính:

1. **Khách vãng lai (Guest):** Người lạ, sinh viên tiềm năng vào đọc bài viết, tìm hiểu về giảng viên.
2. **Sinh viên (Student):** Học viên chính thức, có tài khoản để truy cập dữ liệu học tập riêng tư.
3. **Quản trị viên (Admin - Tôi):** Người toàn quyền quản lý nội dung và dữ liệu.

---

## 3. Chức năng chi tiết theo vai trò

### A. Dành cho Khách vãng lai (Public View)

* **Trang chủ (Homepage):**
    * Giới thiệu profile giảng viên (Kinh nghiệm, môn dạy).
    * Hiển thị các bài viết mới nhất/nổi bật.
* **Blog/Góc chia sẻ:**
    * Đọc bài viết chuyên ngành.
    * Tìm kiếm bài viết, lọc theo chủ đề (Tag/Category).
* **Liên hệ:** Form liên hệ hoặc thông tin social.

### B. Dành cho Sinh viên (Student Portal)

* **Đăng nhập/Đăng ký:**
    * Ưu tiên đăng nhập nhanh bằng **Google (Gmail)** để tiện lợi.
* **Dashboard cá nhân:**
    * Sau khi đăng nhập, sinh viên thấy trang tổng quan của riêng họ.
* **Tra cứu điểm số (Tính năng cốt lõi):**
    * **Bảo mật tuyệt đối:** Sinh viên A chỉ thấy điểm của A. Không xem được của người khác.
    * Xem chi tiết điểm thành phần (Điểm danh, Giữa kỳ, Cuối kỳ) và nhận xét của giảng viên (nếu có).
* **Kho bài tập/Tài liệu:**
    * Tải xuống tài liệu môn học.
    * Làm bài tập luyện tập (dạng trắc nghiệm hoặc xem đề bài).

### C. Dành cho Quản trị viên (Admin Dashboard)

* **Quản lý nội dung (CMS):**
    * Soạn thảo, chỉnh sửa, đăng/ẩn bài viết Blog.
* **Quản lý Sinh viên & Điểm số:**
    * **Import điểm số thông minh:** Tôi không muốn nhập tay từng điểm. Hệ thống phải cho phép **Upload file Excel** (theo mẫu có sẵn) và tự động cập nhật điểm vào hệ thống cho hàng loạt sinh viên.
    * Xem danh sách sinh viên, reset tài khoản nếu cần.
* **Quản lý Môn học:** Tạo môn mới, gán sinh viên vào môn học.

---

## 4. Yêu cầu phi chức năng (Chất lượng hệ thống)

1. **Tính Bảo Mật (Privacy First):**
    * Dữ liệu điểm số là nhạy cảm. Hệ thống phải đảm bảo không có lỗ hổng để sinh viên này "hack" xem điểm sinh viên kia.
2. **Dễ sử dụng (User Friendly):**
    * Giao diện Admin phải tối giản. Quy trình Upload điểm phải nhanh (chỉ 2-3 click).
3. **Hiệu năng & Ổn định:**
    * Chịu tải được khi có lượng lớn sinh viên truy cập cùng lúc (ví dụ lúc vừa công bố điểm thi).
4. **Khả năng mở rộng (Scalability):**
    * Cấu trúc dữ liệu cần thiết kế sẵn để sau này tích hợp thêm tính năng "Khóa học Video" và "Thanh toán Online" mà không phải đập đi xây lại từ đầu.

---

## 5. Quy trình nghiệp vụ chính (User Flow)

**Kịch bản: Công bố điểm thi**

1. Giảng viên chấm điểm xong ở ngoài (trên file Excel).
2. Giảng viên đăng nhập Admin -> Vào mục "Quản lý điểm" -> Chọn Môn học -> Upload file Excel.
3. Hệ thống xử lý file -> Lưu vào Database -> Thông báo thành công.
4. Sinh viên nhận thông báo (hoặc tự vào web) -> Đăng nhập bằng Google -> Thấy ngay điểm số của mình trên Dashboard.

---

### Lời nhắn cho Developer:

> *"Tôi cần một hệ thống có kết cấu vững chắc ngay từ đầu (Layered Architecture) để đảm bảo việc bảo trì và nâng cấp sau này. Ưu tiên công nghệ hiện đại, tải trang nhanh và chuẩn SEO."*