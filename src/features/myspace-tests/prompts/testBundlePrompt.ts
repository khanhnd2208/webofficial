/**
 * Build a copy-ready prompt that instructs an external AI to convert raw
 * quiz material into the My Space Tests questions-only CSV format.
 *
 * Accepts 4-option MCQs and True/False (normalized to 2-option MCQ).
 * Essay / short-answer items must be skipped.
 *
 * Output must be plain CSV text in the chat (copy-paste), never a file attachment.
 */
export function buildTestBundlePrompt(rawData: string): string {
	const trimmed = rawData.trim();
	return `Bạn là trợ lý chuẩn hóa ngân hàng câu hỏi trắc nghiệm (MCQ) cho hệ thống My Space Tests.

NHIỆM VỤ
1. Đọc toàn bộ dữ liệu thô bên dưới (có thể lộn xộn, thiếu cấu trúc, copy từ Word/PDF/Excel; thường lẫn MCQ, True/False và câu tự luận).
2. Trích xuất:
   - Câu trắc nghiệm 4 đáp án (A–D), chỉ đúng 1 đáp án.
   - Câu True/False — chuẩn hóa thành MCQ 2 đáp án (xem quy tắc bên dưới).
3. **Bỏ qua hoàn toàn**:
   - Câu tự luận / short answer / essay (không có options, hoặc phần Answer là đoạn văn dài giải thích).
   - Câu thiếu đáp án đúng hoặc không xác định được đáp án.
4. Trả lời bằng **văn bản CSV thuần trong khung chat** — người dùng sẽ copy-paste thẳng vào web.

ĐỊNH DẠNG ĐẦU RA (BẮT BUỘC — ĐỌC KỸ)
- Chỉ in **nội dung CSV dạng plain text** ngay trong tin nhắn trả lời.
- Dòng đầu tiên phải là header đúng schema; các dòng sau là dữ liệu.
- **CẤM** tạo / tải / đính kèm file \`.csv\` (không canvas, không artifact, không code interpreter download, không “Download file”).
- **CẤM** bọc trong markdown code fence (\`\`\`csv hoặc \`\`\`).
- **CẤM** giải thích, tiêu đề, câu chào, ghi chú trước hoặc sau CSV.
- Toàn bộ phản hồi = CSV và chỉ CSV. Có thể copy nguyên khối dán vào ô nhập liệu.

QUY TẮC NỘI DUNG
- Giữ nguyên văn câu hỏi và đáp án MCQ (không viết lại, không dịch, không thêm bớt).
- Bỏ qua dòng header/footer/số trang/copyright (ví dụ: "© 2025 Pearson Education Ltd. All Rights Reserved.", số trang đơn lẻ, tên sách lặp lại).
- Nếu dữ liệu có heading chương (ví dụ: "Chapter 1 Managers and You in the Workplace"), dùng heading gần nhất làm \`topic\` cho các câu thuộc chương đó; gom topic tương đương về cùng một chuỗi ngắn gọn.
- \`difficulty\`: lấy từ Diff nếu có (số nguyên 1–5; 1 dễ … 5 khó). Nếu không suy ra được, dùng 2.
- \`classification\`: Concept | Application | Analytical | Critical thinking | Synthesis nếu suy ra được; nếu không thì để trống.
- \`aacsb\`, \`learning_objective\`: điền nếu có trong nguồn (AACSB / Learning Obj.); nếu không thì để trống.
- **Không điền** các cột meta bài test (\`test_title\`, \`test_slug\`, \`test_description\`, \`subject\`, \`question_count\`, \`status\`) — người dùng sẽ chọn môn và đặt tên khi lưu trên web.

TRUE/FALSE → MCQ 2 ĐÁP ÁN (bắt buộc chuẩn hóa)
- \`option_a\` = True
- \`option_b\` = False
- \`option_c\` = (để trống)
- \`option_d\` = (để trống)
- Vẫn phải đủ 11 cột: ghi \`,,\` cho hai ô trống option_c/option_d (không bỏ cột).
- \`correct_option\` = A nếu đáp án TRUE, B nếu đáp án FALSE
- Luôn dùng nhãn tiếng Anh "True" / "False" (không dùng Đúng/Sai, Yes/No).

VÍ DỤ PHÂN LOẠI
- GIỮ (MCQ 4 đáp án):
  1) In today's workplace, ________.
  A) …
  B) …
  C) …
  D) …
  Answer: B
- GIỮ (True/False → CSV với option_a=True, option_b=False, option_c/d trống bằng ,, , correct_option=A hoặc B):
  17) Many traditional nonmanagerial jobs now include managerial activities…
  Answer: TRUE
- BỎ (tự luận):
  22) Explain briefly how the definition of a manager has changed over time.
  Answer: Managers used to be defined as…

SCHEMA CSV (dòng 1 = header, đúng thứ tự cột)
topic,stem,option_a,option_b,option_c,option_d,correct_option,difficulty,aacsb,learning_objective,classification

MẪU ĐẦU RA (bắt chước đúng kiểu này — plain text, copy được ngay)
topic,stem,option_a,option_b,option_c,option_d,correct_option,difficulty,aacsb,learning_objective,classification
Chapter 1 Managers and You in the Workplace,"In today's workplace, ________.",women are more likely than men to be promoted into management,many employees perform work that in the past was considered managerial activities,women tend to be more effective supervisors than men,most organizations have eliminated the title of manager,B,2,Reflective thinking,LO 1.1: Describe who managers are and where they work.,Concept
Chapter 1 Managers and You in the Workplace,"Many traditional nonmanagerial jobs now include managerial activities, and many organizations no longer have formal managers.",True,False,,,A,1,Diverse and multicultural work environments,LO 1.1: Describe who managers are and where they work.,Concept

QUY TẮC CSV
- \`correct_option\` chỉ được là A, B, C hoặc D (chữ hoa). Với True/False chỉ được A hoặc B.
- Nếu ô chứa dấu phẩy hoặc dấu ngoặc kép, bọc bằng dấu ngoặc kép và escape " thành "".
- Mỗi dòng = một câu hỏi. Không dòng trống giữa các câu.
- Bắt đầu ngay bằng dòng header. Kết thúc ngay sau dòng câu hỏi cuối. Không thêm gì khác.

DỮ LIỆU THÔ
<<<RAW
${trimmed || '(trống)'}
RAW
`;
}

export type CsvFixPromptError = {
	row: number;
	missing: string[];
	message?: string;
};

/**
 * Build a copy-ready prompt that asks an external AI to repair a questions-only
 * CSV that failed My Space Tests structure validation.
 *
 * Output must be plain CSV text in the chat (copy-paste), never a file attachment.
 */
export function buildCsvFixPrompt(input: {
	csv: string;
	errors: CsvFixPromptError[];
	metaErrors?: string[];
}): string {
	const csv = input.csv.trim() || '(trống)';
	const errorLines: string[] = [];

	for (const msg of input.metaErrors ?? []) {
		errorLines.push(`- [meta] ${msg}`);
	}
	for (const err of input.errors) {
		const detail = err.message ?? `thiếu ${err.missing.join(', ') || '(không rõ)'}`;
		errorLines.push(`- Dòng ${err.row}: ${detail}`);
	}
	if (errorLines.length === 0) {
		errorLines.push('- (không có chi tiết lỗi — hãy kiểm tra lại schema và số cột)');
	}

	return `Bạn là trợ lý sửa CSV ngân hàng câu hỏi trắc nghiệm cho hệ thống My Space Tests.

NHIỆM VỤ
1. CSV bên dưới đã được kiểm tra cấu trúc và **bị lỗi**.
2. Sửa toàn bộ lỗi được liệt kê (và các lỗi tương tự nếu còn).
3. Trả về **văn bản CSV thuần đã sửa hoàn chỉnh trong khung chat** — người dùng copy-paste thẳng vào web.
4. Giữ nguyên nội dung câu hỏi/đáp án đúng; chỉ sửa cấu trúc / mapping cột / encoding True/False.

ĐỊNH DẠNG ĐẦU RA (BẮT BUỘC — ĐỌC KỸ)
- Chỉ in **nội dung CSV dạng plain text** ngay trong tin nhắn trả lời.
- Dòng đầu tiên phải là header đúng schema.
- **CẤM** tạo / tải / đính kèm file \`.csv\` (không canvas, không artifact, không download).
- **CẤM** markdown code fence (\`\`\`csv hoặc \`\`\`).
- **CẤM** giải thích trước/sau. Toàn bộ phản hồi = CSV và chỉ CSV.

SCHEMA CSV (dòng 1 = header, đúng thứ tự, đủ cột)
topic,stem,option_a,option_b,option_c,option_d,correct_option,difficulty,aacsb,learning_objective,classification

QUY TẮC SỬA THƯỜNG GẶP
- Phải có **đúng 11 cột** mỗi dòng (kể cả ô trống). Không được bỏ cột.
- True/False: \`option_a=True\`, \`option_b=False\`, \`option_c\` và \`option_d\` để trống nhưng vẫn ghi \`,,\` giữa các cột; \`correct_option\` chỉ A hoặc B.
- \`correct_option\` chỉ A|B|C|D (chữ hoa). Không được C/D nếu option_c/option_d trống.
- Ô có dấu phẩy hoặc ngoặc kép: bọc bằng " và escape " thành "".
- Không điền meta bài test (\`test_title\`, \`subject\`, …).
- Bỏ dòng essay/tự luận nếu còn sót. Không dòng trống giữa các câu.

LỖI PHÁT HIỆN
${errorLines.join('\n')}

CSV CẦN SỬA
<<<CSV
${csv}
CSV
`;
}
