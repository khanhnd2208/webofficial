/** Prompts the admin copies into ChatGPT / Claude / Gemini, then pastes the result back. */

const FENCE = '````';
const CODE_FENCE = '```';

export const LEARN_LESSON_FORMAT_PROMPT = `Bạn là công cụ chỉ gắn định dạng. Mọi chữ, dấu câu, số, ký hiệu, xuống dòng đoạn, thứ tự của tài liệu gốc phải giữ nguyên từng ký tự. Không sửa chính tả, không đổi dấu ngoặc kép thẳng/cong, không dịch, không tóm tắt, không thêm lời dẫn, tiêu đề, ví dụ, câu hỏi hay đáp án.
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
- === QUIZ: <tên nguyên văn> === chỉ khi gốc gọi khối đó là bài kiểm tra. Định dạng: Câu n: / A. … / Đáp án: X / Giải thích: (chỉ khi gốc có).
- === PRACTICE: <tên nguyên văn> === cho bộ trắc nghiệm luyện tập có đáp án (không phải bài kiểm tra). Cùng định dạng với QUIZ. Không có đáp án → Đáp án: ?, không tự chọn.
- === DISCUSSION: <tên nguyên văn> === cho câu hỏi có đáp án mẫu hoặc gợi ý trả lời. Mỗi câu: Câu n: đứng riêng, tiêu đề thành ###, tình huống thành [!EXAMPLE], câu hỏi thành [!REFLECT], rồi một dòng Đáp án mẫu:. Trong đáp án, nhãn phần thành ###, mỗi bước thành ####, câu kết ngắn thành [!IMPORTANT]. Không dùng ## bên trong câu. Câu hỏi không có đáp án vẫn là [!REFLECT] trong bài đọc, không đưa vào DISCUSSION.

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

const STRUCTURE_GUIDE = `- Bảng bị dàn phẳng (mỗi ô một dòng): nhận ra bằng một chuỗi dòng ngắn lặp lại theo chu kỳ bằng số cột của hàng tiêu đề. Dựng lại thành bảng Markdown, chữ trong ô giữ nguyên văn. Không bao giờ bọc bảng trong ${CODE_FENCE}.
- Danh sách: - cho gạch đầu dòng. Giữ số thứ tự gốc.
- In đậm chỉ khi gốc đã in đậm, hoặc nhãn luận điểm đứng riêng.
- Sơ đồ Mermaid có sẵn thì bọc trong ${CODE_FENCE}mermaid, không đổi chữ.`;

export const LEARN_QUIZ_FORMAT_PROMPT = `Bạn là công cụ chỉ gắn định dạng cho bộ trắc nghiệm. Mọi chữ của câu hỏi, phương án và giải thích phải giữ nguyên từng ký tự. Không sửa chính tả, không dịch, không rút gọn, không thêm câu, phương án hay giải thích, không tự chọn đáp án.

MẪU MỖI CÂU
Câu 1: …
A. …
B. …
Đáp án: B
Giải thích: …
(Giải thích chỉ khi gốc có, được nhiều dòng. Một dòng trống giữa các câu.)

CHỈ ĐƯỢC ĐỔI NHÃN
- Đánh số lại thành Câu 1, Câu 2, …
- a) hoặc 1) thành A. B. C.
- Đáp án lấy từ dấu trong gốc (in đậm, ✓, "(đúng)") hoặc bảng đáp án cuối ("1-B, 2-C") rồi gắn vào đúng câu.
- Gốc không có đáp án → Đáp án: ?
- Câu nhiều đáp án đúng hoặc câu tự luận: không chuyển. Liệt kê nguyên văn bên ngoài khối kết quả.

${STRUCTURE_GUIDE}

CÁCH TRẢ KẾT QUẢ
- Toàn bộ kết quả nằm trong MỘT khối ${FENCE}markdown. Không chữ nào ngoài khối, trừ danh sách câu không chuyển được.
- Bài dài: dừng ở hết một câu, đóng khối, viết <<<CÒN TIẾP>>>. Khi tôi nhắn "tiếp", tiếp tục từ câu kế, không lặp.
- Tự kiểm: số câu trắc nghiệm bằng số câu một đáp án trong gốc.

--- BỘ CÂU GỐC ---
[DÁN VÀO ĐÂY]`;

export const LEARN_DISCUSSION_FORMAT_PROMPT = `Bạn là công cụ chỉ gắn định dạng cho câu hỏi phản biện và đáp án mẫu. Mọi chữ, số, dấu câu và thứ tự phải giữ nguyên. Không sửa chính tả, không dịch, không rút gọn, không thêm câu, bước, tình huống hay đáp án. Chỉ được thêm ký hiệu Markdown liệt kê bên dưới, và chỉ được đổi đúng một nhãn: nhãn mở đáp án thành "Đáp án mẫu:".

VÌ SAO PHẢI GẮN KHỐI
Trang đọc hiện từng câu một. Phần trước nút "Xem đáp án mẫu" là đề bài; phần sau là lời giải. Nếu để "Tình huống:", "Câu hỏi:", "Bước 1 —", "Điều rút ra:" dính đầu đoạn văn, người học thấy một khối chữ không tách được. Hãy đưa mỗi nhãn có sẵn trong gốc lên đúng loại khối bên dưới. Không có nhãn đó trong gốc thì không được tự thêm khối.

MẪU MỘT CÂU — chép hình, không chép chữ ví dụ
## Phần 1. Tên nhóm nguyên văn

Câu 1:
### Hiểu — Tiêu đề câu nguyên văn

> [!EXAMPLE] Tình huống:
> Đoạn tình huống nguyên văn. Dòng tiếp của cùng tình huống cũng bắt đầu bằng >.

> [!REFLECT] Câu hỏi:
> Câu người học phải trả lời, nguyên văn.

Đáp án mẫu:

### Nhắc lại bài học:
Đoạn hoặc danh sách nguyên văn.

### Cùng suy nghĩ từng bước:
Câu dẫn ngay sau nhãn, nếu gốc có.

#### Bước 1 —
Phần còn lại của bước, nguyên văn, kể cả danh sách và bảng.

> [!IMPORTANT] Điều rút ra:
> Câu kết nguyên văn.

Câu 2:
### …

ĐỀ BÀI — nằm trước dòng Đáp án mẫu
- "Câu n:" đứng một mình trên một dòng, rồi một dòng trống. Không viết tiêu đề cùng dòng với "Câu n:".
- Dòng tiêu đề của câu (kèm mức như Hiểu, Áp dụng, Phân tích, Đánh giá, Sáng tạo nếu gốc có) → ### giữ nguyên cả dòng, kể cả dấu gạch.
- "Tình huống:", "Bối cảnh:", "Case:" → khối > [!EXAMPLE], nhãn gốc để nguyên làm tiêu đề khối (giữ dấu hai chấm). Phần chữ sau dấu hai chấm xuống thân khối. Nhiều đoạn thì mỗi dòng thân bắt đầu bằng "> ".
- Dòng "Câu hỏi:" hoặc "Yêu cầu:" — tức câu người học phải trả lời, khác với tiêu đề — → khối > [!REFLECT], cùng cách tách nhãn và thân. Không đánh số lại dòng này thành "Câu n:".
- Không nhét bảng hoặc danh sách nhiều bước vào trong khối >. Bảng và danh sách để ngoài khối.

ĐÁP ÁN — nằm sau đúng một dòng "Đáp án mẫu:"
- Dòng đó đứng riêng, một dòng trống phía trên, không chữ nào khác trên dòng. Nhãn gốc "Gợi ý trả lời", "Gợi ý đáp án", "Hướng dẫn trả lời", "Trả lời", "Đáp án" đều đổi thành dòng này. Chỉ đổi nhãn mở đầu đáp án, một lần.
- Câu không có đáp án trong gốc → vẫn viết "Đáp án mẫu:" rồi để trống, không tự viết.
- "Nhắc lại bài học:", "Kiến thức cần dùng:", "Gợi nhớ:" → ### giữ nguyên nhãn, kể cả dấu hai chấm. Chữ cùng dòng sau dấu hai chấm thành đoạn ngay dưới tiêu đề.
- "Cùng suy nghĩ từng bước:", "Lời giải:", "Phân tích:" → ### cùng cách. Nếu nhãn gốc là "Hướng dẫn:" mà nó nằm trong đáp án, cũng thành ###, không được viết lại thành "Đáp án mẫu:".
- "Bước 1 —", "Bước 2 —", … → #### chỉ gồm nhãn và dấu gạch (ví dụ "#### Bước 1 —"). Phần chữ sau dấu gạch là thân, không cắt giữa câu, không bỏ dấu chấm.
- "Điều rút ra:", "Kết luận:", "Ghi nhớ:" nếu chỉ một đoạn ngắn → > [!IMPORTANT], nhãn gốc làm tiêu đề khối. Nếu phần đó có danh sách hoặc nhiều đoạn → ###, không bọc trong >.
- Đoạn trong đáp án cách nhau một dòng trống. Danh sách bắt đầu sau một dòng trống.

BẢNG, DANH SÁCH, IN ĐẬM
${STRUCTURE_GUIDE}
- Bảng so sánh trong lời giải (mỗi hàng một ý, các cột lặp lại) phải thành bảng Markdown, không để mỗi ô một dòng. Không bọc bảng trong ${CODE_FENCE}.

ĐƯỜNG RÀNH KHÔNG ĐƯỢC VƯỢT
- ## chỉ dùng cho tiêu đề nhóm có sẵn trong gốc (Phần, Chương, nhóm mức). Đặt ## ngay trước "Câu n:" của câu đầu nhóm, cách một dòng trống. Bên trong đề bài và đáp án không được có dòng ##. Tiêu đề con dùng ### hoặc ####. Không dòng nào bắt đầu bằng một dấu #.
- Không được có dòng nào bên trong đáp án bắt đầu bằng "Câu" kèm số ("Câu 1:", "Câu 8:"). Lời nhắc chéo kiểu "xem lại câu 1" phải nằm giữa câu, không đứng đầu dòng. Nếu không, máy sẽ cắt đôi câu.
- "Đáp án mẫu:" chỉ xuất hiện một lần cho mỗi câu, đúng chỗ ngăn đề bài và đáp án.

CÁCH TRẢ KẾT QUẢ
- Toàn bộ kết quả nằm trong MỘT khối ${FENCE}markdown. Không chữ nào ngoài khối.
- Bài dài: dừng ở hết một câu, đóng khối, viết <<<CÒN TIẾP>>>. Khi tôi nhắn "tiếp", tiếp tục từ câu kế, không lặp.
- Tự kiểm trước khi gửi: số câu bằng gốc; không có câu, bước hay nhãn nào do bạn viết; mỗi câu có đúng một dòng Đáp án mẫu:; không còn nhãn "Tình huống:", "Bước n —", "Điều rút ra:" dính đầu một đoạn văn thường.

--- CÂU HỎI GỐC ---
[DÁN VÀO ĐÂY]`;

/** Quizzes and practice share one paste format. */
export const LEARN_FORMAT_PROMPTS = {
	lesson: LEARN_LESSON_FORMAT_PROMPT,
	quiz: LEARN_QUIZ_FORMAT_PROMPT,
	discussion: LEARN_DISCUSSION_FORMAT_PROMPT,
} as const;
