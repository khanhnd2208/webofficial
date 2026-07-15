# Product Direction

## Primary purpose

**Duy Khánh** là website cá nhân của một giảng viên: giới thiệu công việc giảng dạy, chia sẻ điều đang học và lưu lại những suy nghĩ về con người, công việc, cuộc sống. Nội dung và con người luôn xuất hiện trước lời mời làm việc.

### Điều hướng công khai

1. **Trang chủ** — `/`
2. **Giới thiệu** — `/gioi-thieu` (con người, ba nhóm công việc, cách nghĩ về dạy và học)
3. **Bài viết** — `/bai-viet` (Mongo journal; HANOICAM remains editorial brand)
4. **Podcast** — `/phat-trien-ban-than` (chỉ hiện khi có tập thật)
5. **Gửi lời nhắn** — `/lien-he` (liên kết nhẹ, không phải nút chuyển đổi chính)

### Utility / archived (not primary nav)

- Policies under `/chinh-sach/*`
- `/archive` (noindex) for retired public surfaces
- Learner account `/tai-khoan/hoc` and course/lesson routes under `/hoc/khoa-hoc/*`
- Admin, API, `/m/[slug]` remain operational but outside marketing chrome

### Những công việc được giới thiệu

1. Giảng dạy & workshop
2. Thiết kế chương trình học
3. Trao đổi và tư vấn cho cá nhân hoặc đội ngũ

## Access policy

- The owner is the sole author and administrator.
- Public visitors see only `published` marketing and journal routes.
- Signed-in learners only see courses with an `ACTIVE` enrollment.
- Draft routes return 404/noindex — never empty shells in navigation.
- No invented testimonials, milestones, or podcast episodes.

## Current decisions

- Tiếng Việt là ngôn ngữ mặc định trên toàn bộ phần công khai; bài viết có thể song ngữ.
- Phần công việc chỉ được giới thiệu vừa đủ; chi phí được trao đổi riêng khi hai bên đã hiểu nhu cầu.
- Light-only public theme; Cormorant Garamond + Inter only.
- Teaching domain uses PostgreSQL + Prisma; MongoDB remains for auth, posts, profile, messages, streak, and inquiries.
- No marketplace, payment, community, membership, chatbot, or service CMS in this program.

## Nguyên tắc sản phẩm

Mỗi tính năng công khai phải giúp người đọc hiểu Khánh là ai, đọc điều Khánh viết hoặc sử dụng một chức năng học tập có mục đích rõ. Không xây phễu dịch vụ, không thêm thuật ngữ thương hiệu khi một cách nói đời thường đã đủ.
