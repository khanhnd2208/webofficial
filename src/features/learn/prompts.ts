/** Prompts the admin copies into ChatGPT / Claude / Gemini, then pastes the result back. */

const FENCE = '````';

export const LEARN_MARKDOWN_GUIDE = `# Tên bài học
> Một câu mô tả — chỉ khi tài liệu gốc đã có câu đó

=== SECTION: I. Tên mục ===
Nội dung mục bằng Markdown: **đậm**, *nghiêng* chỉ khi gốc đã in như vậy, danh sách, bảng.

Dòng "| 6 phút" sau tên mục là tùy chọn. Hệ thống tự tính thời lượng nếu bỏ.

> [!DEFINITION]
> Nội dung định nghĩa.

> [!QUOTE]
> "Câu trích dẫn."
> — Tác giả (Tác phẩm)

> [!EXAMPLE]
> Nội dung ví dụ.

> [!REFLECT]
> Câu hỏi gợi mở, không có đáp án.

> [!NOTE]
> Ghi chú.

> [!WARNING]
> Lưu ý, cảnh báo.

> [!IMPORTANT]
> Ý cốt lõi mà gốc đã nhấn mạnh.

=== SECTION: II. Tên mục tiếp theo ===
…

=== QUIZ: Kiểm tra nhanh ===
Câu 1: Câu hỏi?
A. Phương án
B. Phương án
Đáp án: A
Giải thích: Vì sao — chỉ khi gốc có.

Trong một mục đọc có thể thêm:

> [!TAKEAWAYS]
> - Ý chính cần nhớ

> [!CHECKPOINT]
> Câu hỏi nhanh?
> A. Sai
> B. Đúng
> Đáp án: B

Chú thích: câu có ghi chú[^1].

[^1]: Nội dung chú thích, đặt ở cuối mục chứa nó.

Ảnh: ![Mô tả](/uploads/ten.webp "Chú thích") hoặc ![Mô tả](/uploads/ten.webp#w=50 "Chú thích")

Chỉ một dòng bắt đầu bằng # . Mỗi dòng # mở một bài mới.`;

export const LEARN_REFORMAT_PROMPT = `Bạn là công cụ chỉ gắn định dạng. Mọi chữ, dấu câu, số, ký hiệu, xuống dòng đoạn, thứ tự của tài liệu gốc phải giữ nguyên từng ký tự. Không sửa chính tả, không đổi dấu ngoặc kép thẳng/cong, không dịch, không tóm tắt, không thêm lời dẫn, tiêu đề, ví dụ, câu hỏi hay đáp án.
Chỉ được thêm các dấu cú pháp liệt kê bên dưới. Nếu phân vân một đoạn thuộc loại khối nào → để nguyên là đoạn văn thường.

CẤU TRÚC BẮT BUỘC
- Dòng 1: #  + tên bài nguyên văn. Đây là dòng DUY NHẤT được bắt đầu bằng một dấu # (mỗi dòng #  sẽ tạo một bài mới).
- Dòng 2 chỉ khi gốc có phụ đề hoặc mô tả ngay dưới tên bài: >  + câu đó. Không có thì bỏ dòng này, không tự viết.
- Đề mục cấp cao nhất của bài (I., II., Chương, Phần, hoặc 1., 2. nếu không có số La Mã) → dòng riêng === SECTION: <tên đề mục nguyên văn> ===. Không thêm số phút (hệ thống tự tính).
- Đề mục con bên trong (1.1, a), tiểu mục) → ##  hoặc ###  + nguyên văn.
- Không đặt dòng > ngay sau === SECTION === (dòng đó sẽ bị coi là tóm tắt). Không tự viết tóm tắt.

KHỐI HỌC THUẬT — chỉ bọc, không đổi chữ. Mỗi dòng trong khối bắt đầu bằng > . Dòng trống trong khối là >.
- > [!DEFINITION] định nghĩa, khái niệm
- > [!QUOTE] trích dẫn (giữ nguyên dòng tác giả như gốc)
- > [!EXAMPLE] ví dụ, tình huống
- > [!REFLECT] câu hỏi thảo luận không có đáp án
- > [!NOTE] ghi chú
- > [!WARNING] lưu ý, cảnh báo
- > [!IMPORTANT] ý cốt lõi mà gốc đã nhấn mạnh
Tiêu đề sau [!KIND] chỉ khi gốc có một dòng nhãn riêng cho khối đó (ví dụ "Ví dụ 3: Toyota") → chuyển nguyên dòng đó lên làm tiêu đề, không lặp lại trong thân. Không có thì để trống.
- > [!TAKEAWAYS] chỉ khi gốc có danh sách "Ý chính", "Ghi nhớ" hoặc "Tóm tắt" rõ ràng; mỗi ý là > - ....
- === QUIZ: <tên nguyên văn> === chỉ khi gốc có câu hỏi trắc nghiệm kèm đáp án. Định dạng: Câu n: / A. … / Đáp án: X / Giải thích: (chỉ khi gốc có). Không có đáp án → dùng [!REFLECT], không tự chọn đáp án.

GIỮ NGUYÊN CÁC PHẦN KHÁC
- Danh sách: -  cho gạch đầu dòng. Giữ số thứ tự gốc cho danh sách số.
- In đậm, in nghiêng chỉ khi gốc có. Không tự thêm.
- Bảng → bảng Markdown, chữ trong ô nguyên văn. Ký tự | trong ô viết \\|. Bảng có ô gộp không chuyển được thì giữ dạng văn bản như gốc.
- Chú thích cuối trang → [^1] và [^1]: nội dung ở cuối mục chứa nó.
- Chú thích hình, sơ đồ giữ nguyên dòng chữ. Ảnh sẽ chèn sau trong studio.

CÁCH TRẢ KẾT QUẢ
- Toàn bộ kết quả nằm trong MỘT khối ${FENCE}markdown … ${FENCE} (4 dấu backtick). Không chữ nào ngoài khối.
- Bài dài: không được rút gọn. Nếu sắp hết độ dài trả lời, dừng ở cuối một SECTION trọn vẹn, đóng khối, và viết dòng <<<CÒN TIẾP>>>. Khi tôi nhắn "tiếp", tiếp tục từ SECTION kế tiếp trong một khối mới, không lặp lại, không có dòng #  lần nữa.
- Tự kiểm tra trước khi gửi: không thiếu đoạn nào, không có câu nào do bạn viết, chỉ một dòng # .

--- TÀI LIỆU GỐC ---
[DÁN TOÀN BỘ BÀI GIẢNG VÀO ĐÂY]`;

export const LEARN_EDIT_PROMPT = `Tôi gửi một bài đã ở định dạng NDK, kèm yêu cầu sửa bên dưới.
Chỉ sửa đúng chỗ được yêu cầu. Giữ nguyên từng ký tự phần còn lại. Giữ nguyên mọi dòng === SECTION: … === và tên mục (để khớp tiến độ học viên).
Trả toàn bộ bài trong một khối ${FENCE}markdown. Không chữ nào ngoài khối. Không rút gọn.

--- YÊU CẦU SỬA ---
[VIẾT YÊU CẦU Ở ĐÂY]

--- BÀI HIỆN TẠI ---
`;

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
