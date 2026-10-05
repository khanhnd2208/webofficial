import { GRAPHIC_COLORS } from '@/config/graphicColors';

export const ACTIVE_RECALL_AI_FORMATTING_GUIDE = `Khi soạn nội dung Active Recall, hãy trả về đúng định dạng để tôi có thể copy-paste trực tiếp.

Mỗi thẻ dùng một trong các cặp nhãn:
- Q: / A:
- Question: / Answer:
- Câu hỏi: / Đáp án:

Nếu muốn thêm bản dịch tiếng Việt cho thẻ (khi câu hỏi/đáp án gốc không phải tiếng Việt), thêm 2 dòng tùy chọn ngay sau Q:/A: của thẻ đó:
- QVI: (bản dịch của câu hỏi)
- AVI: (bản dịch của đáp án)
Có thể chỉ dùng QVI: hoặc AVI: nếu chỉ cần dịch một phía. Bỏ qua cả hai nếu thẻ không cần bản dịch.

Có thể ngăn cách các thẻ bằng dòng ---.

Hỗ trợ định dạng:
- Đậm: **nội dung**
- Nghiêng: *nội dung*
- Gạch chân: <u>nội dung</u>
- Màu chữ: <span style="color: ${GRAPHIC_COLORS['dc2626']}">nội dung</span>

Chỉ dùng các màu sau:
${GRAPHIC_COLORS['475569']}, ${GRAPHIC_COLORS['dc2626']}, ${GRAPHIC_COLORS['ea580c']}, ${GRAPHIC_COLORS['ca8a04']}, ${GRAPHIC_COLORS['15803d']}, ${GRAPHIC_COLORS['2563eb']}, ${GRAPHIC_COLORS['7c3aed']}, ${GRAPHIC_COLORS['db2777']}.

Có thể kết hợp định dạng, ví dụ:
<u><span style="color: ${GRAPHIC_COLORS['dc2626']}">Ý rất quan trọng</span></u>
**<u>Khái niệm cốt lõi</u>**
*Ví dụ minh họa*

Hỗ trợ danh sách:
- Ý thứ nhất
- Ý thứ hai

hoặc:
1. Ý thứ nhất
2. Ý thứ hai

Quy tắc cho bullet points:
- Chỉ đặt bullet trong nội dung câu hỏi hoặc đáp án, sau nhãn Q:/A: hoặc Câu hỏi:/Đáp án:.
- Để danh sách dễ đọc, đặt nhãn đáp án trên một dòng riêng, rồi bắt đầu mỗi bullet ở dòng kế tiếp.
- Mỗi mục phải bắt đầu chính xác bằng "- " (gạch ngang + khoảng trắng) hoặc "1. " (số + dấu chấm + khoảng trắng).
- Không thụt lề đầu dòng, không dùng bullet lồng nhau, không dùng ký hiệu •, *, hoặc – thay cho "- ".
- Không đặt Q:, A:, Question:, Answer:, Câu hỏi:, Đáp án: hoặc --- ở đầu một bullet; nếu cần dùng các cụm này, thêm dấu \\ ở trước.

Ví dụ danh sách đúng:

Câu hỏi: Các mục tiêu của HRM là gì?
Đáp án:
- Thu hút nhân sự phù hợp
- Phát triển năng lực
- Giữ chân nhân viên

Ví dụ danh sách đánh số đúng:

Câu hỏi: Quy trình tuyển dụng gồm những bước nào?
Đáp án:
1. Xác định nhu cầu tuyển dụng
2. Thu hút ứng viên
3. Sàng lọc và lựa chọn

Không dùng bảng Markdown, ảnh, link, heading (#), code block, HTML/CSS ngoài các thẻ <u> và <span style="color: ...">.

Nếu nội dung câu hỏi hoặc đáp án có một dòng bắt đầu bằng Q:, A:, QVI:, AVI:, Question:, Answer:, Câu hỏi:, Đáp án: hoặc ---, hãy thêm dấu \\ ở đầu dòng để hệ thống không hiểu nhầm đó là thẻ mới.

Ví dụ đầu ra:

Câu hỏi: **HRM** là gì?
Đáp án: HRM là *quản trị nguồn nhân lực*.

---
Q: What is job autonomy?
A: The degree of <u>freedom</u> an employee has in deciding how to do their work.
QVI: Job autonomy là gì?
AVI: Mức độ <u>tự do</u> mà nhân viên có khi quyết định cách thực hiện công việc.

---
Câu hỏi: Vì sao job autonomy quan trọng?
Đáp án:
- Tăng <u>trách nhiệm</u>
- Hỗ trợ động lực làm việc
- <span style="color: ${GRAPHIC_COLORS['dc2626']}">Giảm sự phụ thuộc vào giám sát liên tục</span>`;

export async function copyText(value: string) {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(value);
		return;
	}
	const textarea = document.createElement('textarea');
	textarea.value = value;
	textarea.setAttribute('readonly', '');
	textarea.style.position = 'fixed';
	textarea.style.opacity = '0';
	document.body.append(textarea);
	textarea.select();
	const copied = document.execCommand('copy');
	textarea.remove();
	if (!copied) throw new Error('COPY_FAILED');
}
