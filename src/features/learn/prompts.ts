/** Prompts the admin copies into ChatGPT / Claude / Gemini, then pastes the result back. */

const FENCE = '````';
const CODE_FENCE = '```';

export const LEARN_MARKDOWN_GUIDE = `# Tên bài học
> Một câu mô tả — chỉ khi tài liệu gốc đã có câu đó

=== SECTION: I. Tên mục ===
Nội dung mục bằng Markdown: **đậm**, *nghiêng* chỉ khi gốc đã in như vậy, danh sách, bảng.

Dòng "| 6 phút" sau tên mục là tùy chọn. Hệ thống tự tính thời lượng nếu bỏ.

|  | Cột B | Cột C |
| --- | --- | --- |
| Hàng | Ô |  |

\`\`\`mermaid
flowchart TD
    A["Ý trên"] --> B["Ý dưới"]
\`\`\`

> [!TIP]
> Mẹo nhớ.

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
- > [!NOTE] ghi chú, "Lưu ý về từ ngữ", "Đọc thêm"
- > [!WARNING] "Lưu ý", "Lưu ý quan trọng"
- > [!TIP] "Mẹo", "Mẹo nhớ", "Một hình ảnh dễ nhớ"
- > [!IMPORTANT] ý cốt lõi mà gốc đã nhấn mạnh
- "Câu hỏi nhanh", "Liên hệ bản thân", "Thử sức", "Suy ngẫm" → [!REFLECT]
- "Ví dụ…", "Ví dụ tổng hợp" → [!EXAMPLE], gồm cả danh sách đi kèm
Tiêu đề sau [!KIND] chỉ khi gốc có một dòng nhãn riêng cho khối đó (ví dụ "Ví dụ 3: Toyota") → chuyển nguyên dòng đó lên làm tiêu đề, không lặp lại trong thân. Không có thì để trống.
- > [!TAKEAWAYS] chỉ cho "Mục tiêu" hoặc "Bạn sẽ nắm được" ở đầu mục. "Ghi nhớ" hoặc "Tổng kết" ở cuối bài → > [!IMPORTANT] rồi nhãn nguyên văn, vì [!TAKEAWAYS] hiện ở đầu mục với nhãn "Bạn sẽ nắm được".
- === QUIZ: <tên nguyên văn> === chỉ khi gốc có câu hỏi trắc nghiệm kèm đáp án. Định dạng: Câu n: / A. … / Đáp án: X / Giải thích: (chỉ khi gốc có). Không có đáp án → dùng [!REFLECT], không tự chọn đáp án.

CẢNH BÁO: BẢN GỐC CHÉP TỪ DOCS/WORD
Bản chép văn bản thường làm mất bảng, in đậm và sơ đồ. Hãy dựng lại, không đổi chữ trong ô.

- Bảng bị dàn phẳng (mỗi ô một dòng): nhận ra bằng một chuỗi dòng ngắn lặp lại theo chu kỳ bằng số cột của hàng tiêu đề, thường đứng ngay sau một câu dẫn kết thúc bằng ":". Dựng lại thành bảng Markdown, chữ trong ô giữ nguyên văn. Ô gộp (dòng trống trong chuỗi) thì để trống ô đó. Ô đầu tiên của hàng tiêu đề trống thì vẫn giữ ô trống. Không bao giờ bọc bảng trong ${CODE_FENCE}.
- Sơ đồ: nếu bản gốc có mã Mermaid (dòng bắt đầu flowchart, graph, mindmap, timeline, sequenceDiagram) thì bọc nguyên văn trong ${CODE_FENCE}mermaid. Nếu bản gốc có hình hoặc sơ đồ chỉ còn chú thích, hoặc mô tả rõ một cấp bậc, quy trình hay chu trình, được thêm một sơ đồ ${CODE_FENCE}mermaid ngay sau đoạn đó. Không thay chữ, giữ nguyên chú thích.
- Quy tắc vẽ: chỉ dùng flowchart TD cho cấp bậc hoặc sơ đồ từ 5 nút trở lên (dễ đọc trên điện thoại), flowchart LR cho quy trình tối đa 4 bước, và mindmap cho sơ đồ tỏa từ một ý trung tâm. Tối đa 8 nút. Nhãn đặt trong ngoặc kép A["…"], mỗi dòng tối đa khoảng 6 từ, xuống dòng bằng <br/>. ID nút là chữ không dấu. Không dùng style, classDef, click, %%{init}, emoji. Trang đọc tự tô màu.
- Đoạn văn: giữa hai đoạn luôn có một dòng trống. Chỉ giữ xuống dòng đơn trong thơ, địa chỉ hoặc trích dẫn nhiều dòng.
- Nhãn đầu đoạn sang khối, nhãn chuyển thành tiêu đề khối, theo các loại ở trên.
- In đậm: được in đậm nhãn mở đầu như **Lý do 1 —** và thuật ngữ ngay chỗ nó được định nghĩa, vì bản chép văn bản đã làm mất in đậm của bản gốc. Nhãn đứng riêng một dòng kiểu "Thay đổi 1: …", "Lý do 1: …" → ##.
- Byline: bỏ dòng ngày, tác giả, "@Tên" ngay dưới tên bài. Dòng 2 (>) chỉ dành cho mô tả thật.
- Link sang tab hoặc tài liệu khác không có trong bài: giữ nguyên chữ, không tự tạo link.

GIỮ NGUYÊN CÁC PHẦN KHÁC
- Danh sách: -  cho gạch đầu dòng. Giữ số thứ tự gốc cho danh sách số.
- In đậm, in nghiêng theo quy tắc ở trên. Không tự thêm chữ mới.
- Bảng Markdown: chữ trong ô nguyên văn. Ký tự | trong ô viết \\|.
- Chú thích cuối trang → [^1] và [^1]: nội dung ở cuối mục chứa nó.
- Chú thích hình, sơ đồ giữ nguyên dòng chữ. Ảnh sẽ chèn sau trong studio.

CÁCH TRẢ KẾT QUẢ
- Toàn bộ kết quả nằm trong MỘT khối ${FENCE}markdown … ${FENCE} (4 dấu backtick). Không chữ nào ngoài khối.
- Bài dài: không được rút gọn. Nếu sắp hết độ dài trả lời, dừng ở cuối một SECTION trọn vẹn, đóng khối, và viết dòng <<<CÒN TIẾP>>>. Khi tôi nhắn "tiếp", tiếp tục từ SECTION kế tiếp trong một khối mới, không lặp lại, không có dòng #  lần nữa.
- Tự kiểm tra trước khi gửi: không thiếu đoạn nào, không có câu nào do bạn viết, chỉ một dòng #, không còn bảng dàn phẳng, không có ${CODE_FENCE}text, mọi sơ đồ nằm trong ${CODE_FENCE}mermaid.

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
