import type { VocabCsvRowError } from '@/lib/vocab/parseVocabCsv';
import { VOCAB_CSV_COLUMNS } from '@/lib/vocab/parseVocabCsv';

export type VocabPromptContext = {
	courseTitle?: string;
	lessonTitle?: string;
	domain?: string;
};

const HEADER = VOCAB_CSV_COLUMNS.join(',');

/**
 * Copy-ready prompt that asks an external AI to turn a raw word list into
 * the My Class vocabulary CSV format. Output must be plain CSV in chat.
 */
export function buildVocabSetPrompt(rawWords: string, ctx?: VocabPromptContext): string {
	const trimmed = rawWords.trim();
	const course = ctx?.courseTitle?.trim();
	const lesson = ctx?.lessonTitle?.trim();
	const domain = ctx?.domain?.trim() || [course, lesson].filter(Boolean).join(' / ') || 'khóa học hiện tại';
	const contextLines = [
		course ? `- Khóa học: ${course}` : '',
		lesson ? `- Bài học: ${lesson}` : '',
		`- Bối cảnh chuyên ngành: ${domain}`,
	]
		.filter(Boolean)
		.join('\n');

	return `Bạn là trợ lý biên soạn bộ từ vựng học thuật cho hệ thống My Class.

NHIỆM VỤ
1. Đọc danh sách từ thô bên dưới (có thể là bullet, copy từ Word/PDF/Excel, hoặc chỉ là các từ tiếng Anh).
2. Với mỗi từ, điền đủ các trường: từ tiếng Anh, phiên âm IPA, loại từ, nghĩa tiếng Anh, nghĩa tiếng Việt, giải thích chuyên ngành, ví dụ, và gợi ý Guess Who (nếu suy ra được).
3. Trả lời bằng **văn bản CSV thuần trong khung chat** — người dùng sẽ copy-paste thẳng vào web.

BỐI CẢNH
${contextLines}

ĐỊNH DẠNG ĐẦU RA (BẮT BUỘC — ĐỌC KỸ)
- Chỉ in **nội dung CSV dạng plain text** ngay trong tin nhắn trả lời.
- Dòng đầu tiên phải là header đúng schema; các dòng sau là dữ liệu.
- **CẤM** tạo / tải / đính kèm file \`.csv\` (không canvas, không artifact, không download).
- **CẤM** bọc trong markdown code fence (\`\`\`csv hoặc \`\`\`).
- **CẤM** giải thích, tiêu đề, câu chào, ghi chú trước hoặc sau CSV.
- Toàn bộ phản hồi = CSV và chỉ CSV.

SCHEMA CSV (dòng 1 = header, đúng thứ tự cột)
${HEADER}

QUY TẮC NỘI DUNG
- \`term\`: từ tiếng Anh gốc, không dịch.
- \`pronunciation\`: IPA trong dấu /, ví dụ /rɪˈzɪliənt/. Nếu không chắc, để trống.
- \`part_of_speech\`: noun / verb / adjective / adverb / phrase (tiếng Anh, chữ thường).
- \`meaning_en\`: định nghĩa tiếng Anh ngắn, 1 câu.
- \`meaning_vi\`: nghĩa tiếng Việt tự nhiên, có thể thêm nét nghĩa học thuật.
- \`explanation\`: giải thích chuyên ngành **theo bối cảnh khóa học** (không phải định nghĩa từ điển chung). Viết tiếng Việt, 1–2 câu, không lặp lại nguyên \`term\`.
- \`example\`: một câu tiếng Anh dùng từ đó đúng ngữ cảnh khóa học.
- \`hints_hard\`, \`hints_medium\`, \`hints_easy\`: gợi ý Guess Who, tiếng Việt. Nhiều gợi ý trong cùng ô ngăn bằng ||. Có thể để trống.
- Bỏ từ trùng, bỏ heading/số trang/copyright.
- Nếu ô chứa dấu phẩy hoặc dấu ngoặc kép, bọc bằng dấu ngoặc kép và escape " thành "".

MẪU ĐẦU RA (bắt chước đúng kiểu này — plain text, copy được ngay)
${HEADER}
resilient,/rɪˈzɪliənt/,adjective,able to recover quickly from difficulties,có khả năng phục hồi; bền bỉ,"Đặc tính giúp hệ thống hoặc tổ chức trở lại trạng thái ban đầu sau biến cố","The supply chain proved resilient after the disruption.",vật liệu đàn hồi trở về hình dạng ban đầu,khả năng vượt qua nghịch cảnh và phục hồi,có thể phục hồi nhanh sau thất bại

DỮ LIỆU THÔ
<<<RAW
${trimmed || '(trống)'}
RAW
`;
}

/**
 * Copy-ready prompt that asks an external AI to repair a vocabulary CSV
 * that failed My Class structure validation.
 */
export function buildVocabCsvFixPrompt(csv: string, errors: VocabCsvRowError[]): string {
	const text = csv.trim() || '(trống)';
	const errorLines =
		errors.length > 0
			? errors.map((err) => {
					const detail = err.message ?? `thiếu ${err.missing.join(', ') || '(không rõ)'}`;
					return `- Dòng ${err.row}: ${detail}`;
				})
			: ['- (không có chi tiết lỗi — hãy kiểm tra lại schema và số cột)'];

	return `Bạn là trợ lý sửa CSV bộ từ vựng cho hệ thống My Class.

NHIỆM VỤ
1. CSV bên dưới đã được kiểm tra cấu trúc và **bị lỗi**.
2. Sửa toàn bộ lỗi được liệt kê (và các lỗi tương tự nếu còn).
3. Trả về **văn bản CSV thuần đã sửa hoàn chỉnh trong khung chat**.
4. Giữ nguyên nội dung đúng; chỉ sửa cấu trúc / mapping cột / ô thiếu.

ĐỊNH DẠNG ĐẦU RA (BẮT BUỘC — ĐỌC KỸ)
- Chỉ in **nội dung CSV dạng plain text** ngay trong tin nhắn trả lời.
- Dòng đầu tiên phải là header đúng schema.
- **CẤM** tạo / tải / đính kèm file \`.csv\`.
- **CẤM** markdown code fence (\`\`\`csv hoặc \`\`\`).
- **CẤM** giải thích trước/sau. Toàn bộ phản hồi = CSV và chỉ CSV.

SCHEMA CSV (dòng 1 = header, đúng thứ tự, đủ cột)
${HEADER}

QUY TẮC SỬA THƯỜNG GẶP
- Mỗi dòng phải có \`term\` và ít nhất một trong \`meaning_vi\` / \`meaning_en\`.
- Ô có dấu phẩy hoặc ngoặc kép: bọc bằng " và escape " thành "".
- Nhiều gợi ý Guess Who trong cùng ô ngăn bằng ||.
- Không dòng trống giữa các từ.
- Giữ nguyên thứ tự cột của schema.

LỖI PHÁT HIỆN
${errorLines.join('\n')}

CSV CẦN SỬA
<<<CSV
${text}
CSV
`;
}
