/** Prompts the admin copies into ChatGPT / Claude / Gemini, then pastes the result back. */

export const LEARN_MARKDOWN_GUIDE = `# Tên bài học
> Một câu mô tả bài học

=== SECTION: 1. Tên mục | 6 phút ===
> Một câu tóm tắt mục (tùy chọn)

Nội dung mục bằng Markdown: **đậm**, *nghiêng*, danh sách, bảng.

> [!DEFINITION] Tên khái niệm
> Nội dung định nghĩa.

> [!QUOTE]
> "Câu trích dẫn."
> — Tác giả (Tác phẩm)

> [!EXAMPLE] Tên tình huống
> Nội dung ví dụ.

> [!REFLECT] Câu hỏi thảo luận
> Câu hỏi gợi mở.

=== SECTION: 2. Tên mục tiếp theo | 8 phút ===
…`;

export const LEARN_REFORMAT_PROMPT = `Bạn là công cụ định dạng Markdown nguyên văn cho bài giảng khoa học xã hội.
Tôi sẽ dán tài liệu gốc. Việc DUY NHẤT của bạn là chia mục và gắn thẻ theo chuẩn bên dưới.

QUY TẮC BẮT BUỘC
1. Giữ nguyên 100% câu chữ, dấu câu, số liệu, trích dẫn, bảng biểu và thứ tự của tôi.
2. Không viết lại, không diễn giải, không tóm tắt, không thêm lời bình hay kiến thức của bạn.
3. Chỉ chèn dấu phân mục và bọc các khối đặc biệt.

CÁCH ĐỊNH DẠNG
- Dòng đầu: "# [Tên bài học nguyên văn]", dòng sau: "> [Một câu mô tả có sẵn trong tài liệu]".
- Mỗi đề mục lớn có sẵn (I., II., 1., Chương…, Phần…) bắt đầu bằng:
  === SECTION: [Tên đề mục nguyên văn] | [Số phút đọc ước tính] phút ===
  Ngay sau đó, nếu tài liệu có câu mở đầu tóm tắt mục thì đặt: > [câu đó]
- Bọc (không sửa chữ):
  • Trích dẫn tác giả, tác phẩm kinh điển → > [!QUOTE] rồi các dòng "> …", dòng cuối "> — Tác giả (Tác phẩm)"
  • Định nghĩa khái niệm, thuật ngữ → > [!DEFINITION] Tên khái niệm
  • Ví dụ thực tiễn, tình huống, sự kiện lịch sử → > [!EXAMPLE] Tên ví dụ
  • Câu hỏi ôn tập, thảo luận → > [!REFLECT] Tiêu đề
  • Ý cốt lõi cần nhớ → > [!IMPORTANT]
- Giữ nguyên bảng Markdown.

Chỉ trả về Markdown, không chào hỏi, không giải thích.

--- TÀI LIỆU GỐC ---
[DÁN NỘI DUNG CỦA BẠN VÀO ĐÂY]`;

export const LEARN_QUIZ_PROMPT = `Dựa trên nội dung bài học bên dưới, hãy soạn [SỐ CÂU] câu hỏi trắc nghiệm một đáp án đúng.
Trả về đúng định dạng sau, không thêm lời dẫn:

Câu 1: [Câu hỏi]
A. [Phương án]
B. [Phương án]
C. [Phương án]
D. [Phương án]
Đáp án: [Chữ cái đúng]
Giải thích: [Vì sao đáp án đúng, vì sao các phương án khác sai]

Yêu cầu: phương án nhiễu hợp lý, độ dài các phương án tương đương, không dùng "tất cả các ý trên".

--- NỘI DUNG BÀI HỌC ---
[DÁN NỘI DUNG VÀO ĐÂY]`;
