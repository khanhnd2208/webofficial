/**
 * Grades what the import dialog found in a paste. An error blocks saving because the server would reject
 * it or content would be lost; a warning is shown with the one thing to do about it.
 */

import { ANSWER_LABELS, discussionQuestionViews } from './discussionView';
import { findImageRefs } from './images';
import type { ImportedCourse } from './lessonImport';
import { discussionIssues } from './questionHealth';
import { LEARN_MAX_MARKDOWN, LEARN_MAX_QUESTIONS } from './schemas';
import type { LearnDiscussionQuestion } from './types';

export type ImportIssueLevel = 'error' | 'warn';

export interface ImportIssue {
	level: ImportIssueLevel;
	/** 1-based question number in the paste, when the issue belongs to one question. */
	question?: number;
	text: string;
	fix: string;
}

export interface ImportReport {
	issues: ImportIssue[];
	errors: number;
	warnings: number;
}

const MAX_QUESTION = 8_000;
const MAX_ANSWER = 30_000;

const FIX_CONTINUE = "Nhắn AI 'tiếp', rồi dán phần còn lại nối vào cuối ô.";
const FIX_IMAGES = 'Chọn hoặc kéo thả ảnh có tên file khớp vào khung ảnh ở phần xem trước.';

function report(issues: ImportIssue[]): ImportReport {
	const sorted = [...issues].sort(
		(a, b) =>
			(a.level === b.level ? 0 : a.level === 'error' ? -1 : 1) ||
			(a.question ?? 0) - (b.question ?? 0),
	);
	const errors = sorted.filter((issue) => issue.level === 'error').length;
	return { issues: sorted, errors, warnings: sorted.length - errors };
}

/** Local file names the AI kept from the source; external links are reported by the lesson parser. */
function imageIssue(markdown: string, includeExternal: boolean): ImportIssue | null {
	const pending = findImageRefs(markdown).filter(
		(ref) => ref.status === 'missing' || (includeExternal && ref.status === 'external'),
	).length;
	return pending
		? {
				level: 'warn',
				text: `${pending} ảnh chưa tải lên, học viên sẽ không thấy.`,
				fix: FIX_IMAGES,
			}
		: null;
}

/** Lines outside code fences, so examples inside ``` never raise issues. */
function proseLines(markdown: string): string[] {
	let open = false;
	return markdown.split('\n').filter((line) => {
		if (/^\s*(`{3,}|~{3,})/.test(line)) {
			open = !open;
			return false;
		}
		return !open;
	});
}

/** The ask block is there but glued to the line above, so the reader cannot split it out. */
const ASK_GLUED_RE =
	/\S[^\n]*\n(?:>\s*\[![A-Za-z]+\]\s*)?(?:\*\*)?(?:Câu hỏi|Yêu cầu)(?:\*\*)?\s*[:：]/i;
/** Answer labels at the start of a line in the prompt mean the "Đáp án mẫu:" line was missed. */
const ANSWER_IN_PROMPT_RE = new RegExp(
	`^(?:#{2,4}\\s+|>\\s*\\[![A-Za-z]+\\]\\s*)?(?:\\*\\*)?(?:${[...ANSWER_LABELS, 'Gợi ý trả lời', 'Gợi ý đáp án', 'Hướng dẫn trả lời', 'Đáp án'].join('|')})(?:\\*\\*)?\\s*(?:[:：]|$)`,
	'im',
);
const STEP_PLAIN_RE = /^(?:\*\*)?Bước\s+\d+\s*(?:\*\*)?\s*[—–-]/i;

function parserIssue(warning: string): ImportIssue | null {
	if (/thiếu đáp án mẫu/i.test(warning)) return null; // reported per question below
	if (/chưa trả hết/i.test(warning)) return { level: 'warn', text: warning, fix: FIX_CONTINUE };
	if (/chưa có câu hỏi/i.test(warning)) {
		return {
			level: 'error',
			text: `${warning.replace(/\.$/, '')}, phần này sẽ bị bỏ khi lưu.`,
			fix: 'Thêm phần đề bài ngay dưới dòng "Câu n:", hoặc xóa dòng "Câu n:" thừa.',
		};
	}
	if (/không nối tiếp/i.test(warning)) {
		return {
			level: 'warn',
			text: warning,
			fix: 'So số câu với bản gốc. Nếu AI bỏ sót câu, yêu cầu AI định dạng lại câu đó.',
		};
	}
	return { level: 'warn', text: warning, fix: '' };
}

export function discussionImportReport({
	markdown,
	pasteWarnings,
	questions,
	parseWarnings,
	existingCount = 0,
}: {
	markdown: string;
	pasteWarnings: string[];
	questions: LearnDiscussionQuestion[];
	parseWarnings: string[];
	existingCount?: number;
}): ImportReport {
	const issues: ImportIssue[] = [];
	for (const warning of [...pasteWarnings, ...parseWarnings]) {
		const issue = parserIssue(warning);
		if (issue) issues.push(issue);
	}
	if (markdown.trim() && !questions.length) {
		issues.push({
			level: 'error',
			text: 'Không tìm thấy câu nào.',
			fix: 'Mỗi câu phải mở bằng dòng "Câu 1:" đứng riêng. Chép prompt định dạng, đưa cho AI cùng bản gốc, rồi dán lại kết quả.',
		});
	}
	if (existingCount + questions.length > LEARN_MAX_QUESTIONS) {
		issues.push({
			level: 'error',
			text: `Mục này sẽ có ${existingCount + questions.length} câu, vượt giới hạn ${LEARN_MAX_QUESTIONS} câu.`,
			fix: 'Tách thành hai mục phản biện.',
		});
	}

	const views = discussionQuestionViews(questions.map((item) => item.question));
	questions.forEach((item, index) => {
		const question = index + 1;
		if (item.question.trim().length > MAX_QUESTION) {
			issues.push({
				level: 'error',
				question,
				text: `Đề bài dài hơn ${MAX_QUESTION.toLocaleString('vi-VN')} ký tự.`,
				fix: 'Kiểm tra dòng "Đáp án mẫu:" có đứng riêng một dòng không; nếu thiếu, cả đáp án bị tính vào đề bài.',
			});
		}
		if (item.answer.trim().length > MAX_ANSWER) {
			issues.push({
				level: 'error',
				question,
				text: `Đáp án dài hơn ${MAX_ANSWER.toLocaleString('vi-VN')} ký tự.`,
				fix: 'Kiểm tra dòng "Câu n:" của câu sau có đứng riêng một dòng không.',
			});
		}
		const health = discussionIssues(item, views[index]);
		if (!item.answer.trim() && ANSWER_IN_PROMPT_RE.test(item.question)) {
			issues.push({
				level: 'error',
				question,
				text: 'Lời giải đang nằm trong đề bài, học viên sẽ thấy đáp án trước khi bấm xem.',
				fix: 'Đặt dòng "Đáp án mẫu:" đứng riêng ngay trước phần lời giải (thường là "Nhắc lại bài học:").',
			});
		} else if (health.includes('Thiếu đáp án mẫu')) {
			issues.push({
				level: 'warn',
				question,
				text: 'Chưa có đáp án mẫu.',
				fix: 'Nếu gốc có đáp án, đặt dòng "Đáp án mẫu:" đứng riêng ngay trước nó. Có thể viết đáp án sau trong Studio.',
			});
		}
		if (health.includes('Chưa có khối Câu hỏi')) {
			issues.push({
				level: 'warn',
				question,
				text: 'Chưa có khối Câu hỏi, học viên không thấy rõ câu cần trả lời.',
				fix: ASK_GLUED_RE.test(item.question)
					? 'Thêm một dòng trống ngay trước dòng "> [!REFLECT] Câu hỏi:".'
					: 'Đặt câu cần trả lời sau dòng "> [!REFLECT] Câu hỏi:".',
			});
		}
		const body = [...proseLines(item.question).slice(1), ...proseLines(item.answer)];
		if (body.some((line) => /^##\s+\S/.test(line.trim()))) {
			issues.push({
				level: 'warn',
				question,
				text: 'Có dòng ## giữa câu, sẽ hiện như tiêu đề nhóm.',
				fix: 'Đổi dòng đó thành ### hoặc ####. ## chỉ dùng cho tên nhóm đặt trước "Câu n:".',
			});
		}
		if (proseLines(item.answer).some((line) => STEP_PLAIN_RE.test(line.trim()))) {
			issues.push({
				level: 'warn',
				question,
				text: '"Bước n —" còn dính đầu đoạn, các bước không tách nhau.',
				fix: 'Viết "#### Bước 1 —" trên một dòng riêng, phần giải thích xuống dòng dưới.',
			});
		}
	});

	const images = imageIssue(markdown, true);
	if (images) issues.push(images);
	return report(issues);
}

function lessonIssue(warning: string): ImportIssue {
	if (/vượt giới hạn/i.test(warning)) return { level: 'error', text: warning, fix: '' };
	if (/chưa trả hết/i.test(warning)) return { level: 'warn', text: warning, fix: FIX_CONTINUE };
	if (/ảnh ngoài/i.test(warning)) return { level: 'warn', text: warning, fix: FIX_IMAGES };
	if (/dấu phân mục|tiêu đề cấp 2/i.test(warning)) {
		return {
			level: 'warn',
			text: warning,
			fix: 'Mỗi đề mục lớn cần dòng "=== SECTION: Tên mục ===". Dùng prompt định dạng để AI gắn.',
		};
	}
	if (/mermaid/i.test(warning)) {
		return { level: 'warn', text: warning, fix: 'Bọc sơ đồ trong khối ```mermaid … ```.' };
	}
	if (/dàn phẳng/i.test(warning)) {
		return { level: 'warn', text: warning, fix: 'Yêu cầu AI dựng lại thành bảng Markdown.' };
	}
	if (/chưa có nội dung/i.test(warning)) {
		return {
			level: 'warn',
			text: warning,
			fix: 'Xóa mục trống hoặc viết nội dung sau trong Studio.',
		};
	}
	if (/^Có nhiều dòng #/.test(warning)) {
		return { level: 'warn', text: warning, fix: 'Chọn "Tạo bài mới" để mỗi dòng # thành một bài.' };
	}
	return { level: 'warn', text: warning, fix: '' };
}

export function lessonImportReport({
	markdown,
	parsed,
	merging = false,
}: {
	markdown: string;
	parsed: ImportedCourse;
	/** Replace mode writes every pasted lesson into one existing lesson. */
	merging?: boolean;
}): ImportReport {
	const issues = parsed.warnings.map(lessonIssue);
	if (merging && parsed.lessons.length > 1) {
		issues.push(lessonIssue('Có nhiều dòng # — chế độ này sẽ gộp nhiều bài vào một bài.'));
	}
	const sections = parsed.lessons.flatMap((lesson) => lesson.sections);
	if (markdown.trim() && !sections.length) {
		issues.push({
			level: 'error',
			text: 'Không tìm thấy mục nào có nội dung.',
			fix: 'Chép prompt định dạng, đưa cho AI cùng bản gốc, rồi dán lại kết quả.',
		});
	}
	if (
		sections.some((section) => section.markdown.length > LEARN_MAX_MARKDOWN) &&
		!issues.some((issue) => issue.level === 'error')
	) {
		issues.push({
			level: 'error',
			text: 'Có mục vượt giới hạn độ dài.',
			fix: 'Tách mục đó thành hai.',
		});
	}
	const images = imageIssue(markdown, false);
	if (images) issues.push(images);
	return report(issues);
}
