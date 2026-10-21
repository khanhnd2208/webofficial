/**
 * NDK lesson markdown import.
 *
 *   # Lesson title
 *   > Lesson description
 *
 *   === SECTION: 1. Section title | 6 phút ===
 *   > Section summary
 *   Section body (markdown, callouts)
 *
 * Also accepts `--- SECTION:` / `### MỤC:` delimiters, and falls back to `##` headings.
 */

import { countWords } from './content';
import { discussionMarkdown, parseDiscussionPaste } from './discussionImport';
import { findExternalImages } from './images';
import { LEARN_MAX_MARKDOWN } from './schemas';
import { isRetiredPracticeHeading, stripRetiredPracticeBlocks } from './retiredBlocks';
import type { LearnDiscussion, LearnSectionKind } from './types';

export interface ImportedSection {
	title: string;
	durationMinutes: number | null;
	summary: string;
	markdown: string;
	wordCount: number;
	type: LearnSectionKind;
	keyTakeaways: string[];
	checkpoint: null;
	discussion: LearnDiscussion | null;
}

export interface ImportedLesson {
	lessonTitle: string;
	lessonDescription: string;
	sections: ImportedSection[];
	warnings: string[];
}

/**
 * Vietnamese aliases only count on === / --- lines: lectures use "## Luyện tập: …" or
 * "### Kiểm tra: …" as ordinary subheadings, which must stay inside their reading section.
 */
const SECTION_DELIMITER_RE =
	/^(?:(?:={3,}|-{3,})\s*(SECTION|MỤC|PHẦN|QUIZ|KIỂM\s*TRA|KIEM\s*TRA|PRACTICE|LUYỆN\s*TẬP|LUYEN\s*TAP|DISCUSSION|PHẢN\s*BIỆN|PHAN\s*BIEN)|#{2,3}\s*(SECTION|MỤC|PHẦN|QUIZ|PRACTICE|DISCUSSION))\s*:\s*(.+?)(?:\s*(?:={3,}|-{3,}))?$/i;

/** Quizzes and practice sets are retired: their delimiters still end the previous section. */
type SliceKind = LearnSectionKind | 'RETIRED';

function sliceKind(label: string): SliceKind {
	const key = label.toLocaleLowerCase('vi').replace(/\s+/g, '');
	if (['quiz', 'kiểmtra', 'kiemtra', 'practice', 'luyệntập', 'luyentap'].includes(key)) {
		return 'RETIRED';
	}
	if (key === 'discussion' || key === 'phảnbiện' || key === 'phanbien') return 'DISCUSSION';
	return 'READING';
}

function isPlainQuote(line: string): boolean {
	return line.startsWith('>') && !/^>\s*\[!/.test(line);
}

function parseDuration(raw: string): number | null {
	const minutes = raw.match(/(\d{1,3})\s*(?:phút|phut|min|minutes?|')/i);
	if (minutes) {
		const value = Number(minutes[1]);
		return value > 0 ? value : null;
	}
	const hours = raw.match(/(\d{1,2})\s*(?:giờ|gio|hours?|h)(?!\w)/i);
	if (hours) {
		const value = Number(hours[1]) * 60;
		return value > 0 ? value : null;
	}
	const bare = raw.match(/^\s*(\d{1,3})\s*$/);
	if (!bare) return null;
	const value = Number(bare[1]);
	return value > 0 ? value : null;
}

/** True for lines inside a ``` or ~~~ fenced code block, so delimiters and markers there are left alone. */
function computeFenceMask(lines: string[]): boolean[] {
	const mask = new Array(lines.length).fill(false);
	let inFence = false;
	for (let i = 0; i < lines.length; i++) {
		if (/^\s*(`{3,}|~{3,})/.test(lines[i])) {
			mask[i] = true;
			inFence = !inFence;
			continue;
		}
		mask[i] = inFence;
	}
	return mask;
}

/**
 * A line opening with a 3–4 digit number and a period — "1945. Năm lịch sử" — parses as
 * an ordered list start under CommonMark and gets renumbered on the next save. Escape the
 * period so years stay plain text; real list numbering essentially never starts past 99.
 */
function escapeYearLikeListMarkers(lines: string[], mask: boolean[]): string[] {
	return lines.map((line, i) => {
		if (mask[i]) return line;
		const atParagraphStart = i === 0 || lines[i - 1].trim() === '' || mask[i - 1];
		if (!atParagraphStart) return line;
		const match = line.match(/^(\s{0,3})(\d{3,4})\.(\s.*)$/);
		return match ? `${match[1]}${match[2]}\\.${match[3]}` : line;
	});
}

function splitTitleAndDuration(titleLine: string): {
	title: string;
	durationMinutes: number | null;
} {
	let title = titleLine;
	let durationMinutes: number | null = null;
	if (title.includes('|')) {
		const [head, ...rest] = title.split('|');
		title = head;
		durationMinutes = parseDuration(rest.join('|').replace(/[=-]+\s*$/, ''));
	} else {
		const bracket = title.match(/[([]\s*(\d{1,3}\s*phút(?:\s*đọc)?)\s*[)\]]/i);
		if (bracket) {
			durationMinutes = parseDuration(bracket[1]);
			title = title.replace(bracket[0], '');
		}
	}
	return { title: title.replace(/[=-]+\s*$/, '').trim(), durationMinutes };
}

interface Slice {
	titleLine: string;
	kind: SliceKind;
	start: number;
}

function pullCallout(markdown: string, tag: string): { body: string | null; rest: string } {
	const lines = markdown.split('\n');
	const start = lines.findIndex((line) => new RegExp(`^>\\s*\\[!${tag}\\]`, 'i').test(line.trim()));
	if (start < 0) return { body: null, rest: markdown };
	let end = start + 1;
	while (end < lines.length && /^>\s?/.test(lines[end]) && !/^>\s*\[!/.test(lines[end].trim()))
		end += 1;
	const body = lines
		.slice(start + 1, end)
		.map((line) => line.replace(/^>\s?/, '').trim())
		.filter(Boolean)
		.join('\n');
	const rest = [...lines.slice(0, start), ...lines.slice(end)]
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
	return { body, rest };
}

function takeawayItems(body: string): string[] {
	return body
		.split('\n')
		.map((line) => line.replace(/^[-*]\s+/, '').trim())
		.filter(Boolean);
}

function readingSection(
	title: string,
	durationMinutes: number | null,
	summary: string,
	markdown: string,
	warnings: string[],
): ImportedSection {
	const takeaways = pullCallout(markdown, 'TAKEAWAYS');
	const checkpoint = pullCallout(takeaways.rest, 'CHECKPOINT');
	if (checkpoint.body) {
		warnings.push(
			`"${title}": đã bỏ câu hỏi nhanh. Khóa học không còn câu trắc nghiệm gắn trong bài giảng.`,
		);
	}
	const stripped = stripRetiredPracticeBlocks(checkpoint.rest);
	for (const heading of stripped.removed) {
		warnings.push(
			`"${title}": đã bỏ phần "${heading}". Phần ôn tập hoặc thực hành riêng không còn được nhập.`,
		);
	}
	const body = stripped.markdown;
	return {
		title,
		durationMinutes,
		summary,
		markdown: body,
		wordCount: countWords(body),
		type: 'READING',
		keyTakeaways: takeaways.body ? takeawayItems(takeaways.body) : [],
		checkpoint: null,
		discussion: null,
	};
}

/** The "how to use these questions" section written just before a discussion. */
const DISCUSSION_INTRO_RE = /^cách dùng bộ câu hỏi/i;
const DISCUSSION_INTRO_TITLE = 'Cách dùng bộ câu hỏi';

/**
 * A reading section titled "Cách dùng bộ câu hỏi…" right before a discussion is its intro: it is
 * removed from `sections` and returned so the discussion page can show it above the questions.
 */
function takeDiscussionIntro(sections: ImportedSection[]): string {
	const previous = sections.at(-1);
	if (!previous || previous.type !== 'READING' || !DISCUSSION_INTRO_RE.test(previous.title)) {
		return '';
	}
	sections.pop();
	return previous.markdown;
}

export function parseLessonMarkdown(raw: string): ImportedLesson {
	const warnings: string[] = [];
	const lines = raw.replace(/\r\n?/g, '\n').split('\n');

	let lessonTitle = '';
	let lessonDescription = '';
	let titleIndex = -1;
	let descriptionIndex = -1;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		if (/^#\s+/.test(line)) {
			lessonTitle = line.replace(/^#\s+/, '').trim();
			titleIndex = i;
			for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
				const next = lines[j].trim();
				if (!next) continue;
				if (isPlainQuote(next)) {
					lessonDescription = next.replace(/^>\s*/, '').trim();
					descriptionIndex = j;
				}
				break;
			}
			break;
		}
	}

	const fenceMask = computeFenceMask(lines);

	const slices: Slice[] = [];
	lines.forEach((line, index) => {
		if (fenceMask[index]) return;
		const match = line.trim().match(SECTION_DELIMITER_RE);
		if (match)
			slices.push({
				titleLine: match[3].trim(),
				kind: sliceKind(match[1] ?? match[2]),
				start: index,
			});
	});

	if (!slices.length) {
		lines.forEach((line, index) => {
			if (fenceMask[index]) return;
			if (index !== titleIndex && /^##\s+/.test(line.trim())) {
				slices.push({
					titleLine: line.trim().replace(/^##\s+/, ''),
					kind: 'READING',
					start: index,
				});
			}
		});
	}

	function checkOversized(title: string, markdown: string) {
		if (markdown.length > LEARN_MAX_MARKDOWN) {
			warnings.push(
				`"${title}": ${markdown.length.toLocaleString('vi-VN')} ký tự, vượt giới hạn ${LEARN_MAX_MARKDOWN.toLocaleString('vi-VN')} ký tự cho một mục. Hãy tách nhỏ mục này trước khi nhập.`,
			);
		}
	}

	function buildMarkdown(start: number, end: number): string {
		return escapeYearLikeListMarkers(lines.slice(start, end), fenceMask.slice(start, end))
			.join('\n')
			.trim();
	}

	const bodyStart = Math.max(titleIndex, descriptionIndex) + 1;

	if (!slices.length) {
		const markdown = buildMarkdown(bodyStart, lines.length);
		warnings.push('Không tìm thấy dấu phân mục. Toàn bộ nội dung được gom thành 1 mục.');
		if (markdown) checkOversized(lessonTitle || 'Nội dung bài học', markdown);
		const external = findExternalImages(markdown);
		if (external.length)
			warnings.push(`Ảnh ngoài sẽ không hiển thị, hãy tải lên: ${external.join(', ')}`);
		return {
			lessonTitle: lessonTitle || 'Bài học mới',
			lessonDescription,
			sections: markdown
				? [readingSection(lessonTitle || 'Nội dung bài học', null, '', markdown, warnings)]
				: [],
			warnings,
		};
	}

	const sections: ImportedSection[] = [];

	const preambleLines = lines.slice(bodyStart, slices[0].start);
	const preamble = preambleLines.join('\n').trim();
	if (preamble) {
		let introStart = bodyStart;
		if (!lessonDescription && isPlainQuote(preambleLines[0]?.trim() ?? '')) {
			lessonDescription = preambleLines[0].trim().replace(/^>\s*/, '').trim();
			introStart += 1;
		}
		const introMarkdown = buildMarkdown(introStart, slices[0].start);
		if (introMarkdown) {
			checkOversized('Giới thiệu', introMarkdown);
			sections.push(readingSection('Giới thiệu', null, '', introMarkdown, warnings));
		}
	}

	slices.forEach((slice, index) => {
		const end = index + 1 < slices.length ? slices[index + 1].start : lines.length;
		const body = lines.slice(slice.start + 1, end);
		const bodyMask = fenceMask.slice(slice.start + 1, end);
		const { title, durationMinutes } = splitTitleAndDuration(slice.titleLine);

		// Summary = a plain `>` quote as the first non-empty line of the section only.
		let summary = '';
		const firstContent = body.findIndex((line) => line.trim());
		if (firstContent >= 0 && !bodyMask[firstContent] && isPlainQuote(body[firstContent].trim())) {
			summary = body[firstContent].trim().replace(/^>\s*/, '').trim();
			body.splice(firstContent, 1);
			bodyMask.splice(firstContent, 1);
		}

		const markdown = escapeYearLikeListMarkers(body, bodyMask).join('\n').trim();
		const sectionTitle = title || `Mục ${sections.length + 1}`;
		if (slice.kind === 'RETIRED' || isRetiredPracticeHeading(sectionTitle)) {
			warnings.push(
				`"${sectionTitle}": đã bỏ qua. Khóa học chỉ còn bài giảng và câu hỏi phản biện, không nhập bài kiểm tra, luyện tập hay phần ôn tập riêng.`,
			);
			return;
		}
		if (slice.kind === 'DISCUSSION') {
			const pasted = parseDiscussionPaste(markdown);
			for (const warning of pasted.warnings) warnings.push(`"${sectionTitle}": ${warning}`);
			const intro = takeDiscussionIntro(sections);
			sections.push({
				title: sectionTitle,
				durationMinutes,
				summary,
				markdown: intro,
				wordCount:
					countWords(intro) +
					pasted.questions.reduce(
						(sum, question) => sum + countWords(`${question.question}\n${question.answer}`),
						0,
					),
				type: 'DISCUSSION',
				keyTakeaways: [],
				checkpoint: null,
				discussion: { questions: pasted.questions },
			});
			return;
		}
		if (markdown) checkOversized(sectionTitle, markdown);
		const external = findExternalImages(markdown);
		if (external.length)
			warnings.push(
				`"${sectionTitle}": ảnh ngoài sẽ không hiển thị, hãy tải lên (${external.length}).`,
			);
		sections.push(readingSection(sectionTitle, durationMinutes, summary, markdown, warnings));
	});

	const empty = sections.filter(
		(section) =>
			section.type === 'READING' &&
			!section.markdown &&
			!section.keyTakeaways.length &&
			!section.checkpoint,
	).length;
	if (empty) warnings.push(`${empty} mục chưa có nội dung.`);

	return {
		lessonTitle: lessonTitle || (sections[0] ? `Bài học: ${sections[0].title}` : 'Bài học mới'),
		lessonDescription,
		sections,
		warnings,
	};
}

export interface ImportedCourse {
	lessons: ImportedLesson[];
	warnings: string[];
}

const CONTINUATION = /^<<<\s*CÒN TIẾP\s*>>>$/i;
const MARKDOWN_FENCE_OPEN = /^(`{3,}|~{3,})(markdown|md)\s*$/i;

/**
 * Pulls AI chat output down to the markdown the parser understands.
 * Keeps the inside of ```markdown / ````md / ~~~markdown fences (several "tiếp" parts
 * are joined in order). An unlabeled code fence inside the lecture stays as content.
 */
export function cleanAiPaste(raw: string): { markdown: string; warnings: string[] } {
	const text = raw.replace(/\r\n?/g, '\n');
	const lines = text.split('\n');
	const blocks: string[] = [];
	for (let i = 0; i < lines.length; i++) {
		const open = lines[i].trim().match(MARKDOWN_FENCE_OPEN);
		if (!open) continue;
		const fence = open[1][0];
		const width = open[1].length;
		const body: string[] = [];
		i += 1;
		for (; i < lines.length; i++) {
			const close = lines[i].trim().match(/^(`{3,}|~{3,})\s*$/);
			if (close && close[1][0] === fence && close[1].length >= width) break;
			body.push(lines[i]);
		}
		blocks.push(body.join('\n'));
	}
	const source = (blocks.length ? blocks.join('\n\n') : text).split('\n');
	const warnings: string[] = [];
	const lastRaw = [...lines].reverse().find((line) => line.trim());
	const lastContent = [...source].reverse().find((line) => line.trim());
	if (
		(lastRaw && CONTINUATION.test(lastRaw.trim())) ||
		(lastContent && CONTINUATION.test(lastContent.trim()))
	) {
		warnings.push("AI chưa trả hết bài, nhắn 'tiếp' và dán phần còn lại");
	}
	const markdown = source
		.filter((line) => !CONTINUATION.test(line.trim()))
		.join('\n')
		.trim();
	return { markdown, warnings };
}

const RAW_MERMAID_LINE =
	/^(?:(?:flowchart|graph)\s+(?:TD|TB|BT|LR|RL)|mindmap|timeline|sequenceDiagram)\b/;
const DOC_BYLINE = /·\s*@\S/;

function looksLikeFlatTable(body: string[]): boolean {
	const rows = body.map((line) => line.trim()).filter(Boolean);
	if (rows.length < 4) return false;
	const short = rows.filter((line) => line.length <= 80 && !/[.!?…]/.test(line));
	return short.length >= 4 && short.length / rows.length >= 0.6;
}

/** Flags diagrams and flattened tables the AI prompt is supposed to rebuild. */
export function structureWarnings(markdown: string): string[] {
	const warnings: string[] = [];
	const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
	const mask = computeFenceMask(lines);
	if (lines.some((line, index) => !mask[index] && RAW_MERMAID_LINE.test(line.trim()))) {
		warnings.push('Có sơ đồ chưa bọc trong khối ```mermaid');
	}
	let open = false;
	let lang = '';
	let body: string[] = [];
	const flush = () => {
		if (open && (lang === 'text' || lang === '') && looksLikeFlatTable(body)) {
			warnings.push('Có khối mã trông như bảng bị dàn phẳng. Hãy để AI dựng lại thành bảng');
		}
		open = false;
		lang = '';
		body = [];
	};
	for (const line of lines) {
		const fence = line.trim().match(/^(`{3,}|~{3,})(.*)$/);
		if (fence) {
			if (!open) {
				open = true;
				lang = fence[2].trim().toLowerCase();
				body = [];
			} else flush();
			continue;
		}
		if (open) body.push(line);
	}
	flush();
	return [...new Set(warnings)];
}

/** One file may hold several lessons. Each top-level `# ` line, outside a code fence, starts one. */
export function parseCourseMarkdown(raw: string): ImportedCourse {
	const cleaned = cleanAiPaste(raw);
	const source = cleaned.markdown;
	const lines = source.split('\n');
	const mask = computeFenceMask(lines);
	const starts: number[] = [];
	lines.forEach((line, index) => {
		if (!mask[index] && /^#\s+\S/.test(line.trim())) starts.push(index);
	});
	const structural = structureWarnings(source);
	const byline = (description: string) =>
		DOC_BYLINE.test(description) ? ['Dòng mô tả là tên tác giả/ngày, không phải mô tả'] : [];
	if (starts.length <= 1) {
		const lesson = parseLessonMarkdown(source);
		return {
			lessons: [lesson],
			warnings: [
				...cleaned.warnings,
				...structural,
				...byline(lesson.lessonDescription),
				...lesson.warnings,
			],
		};
	}
	const lessons = starts.map((start, index) => {
		const end = index + 1 < starts.length ? starts[index + 1] : lines.length;
		return parseLessonMarkdown(lines.slice(start, end).join('\n'));
	});
	return {
		lessons,
		warnings: [
			...cleaned.warnings,
			...structural,
			...lessons.flatMap((lesson) => [...byline(lesson.lessonDescription), ...lesson.warnings]),
		],
	};
}

function durationLabel(minutes: number | null): string {
	return minutes ? ` | ${minutes} phút` : '';
}

export interface ExportableSection {
	type: LearnSectionKind;
	title: string;
	durationMinutes: number | null;
	summary: string;
	markdown: string;
	keyTakeaways: string[];
	discussion: LearnDiscussion | null;
}

export interface ExportableLesson {
	title: string;
	description: string;
	sections: ExportableSection[];
}

export function exportLessonMarkdown(lesson: ExportableLesson): string {
	const lines = [`# ${lesson.title}`];
	if (lesson.description.trim()) lines.push(`> ${lesson.description.trim()}`);
	for (const section of lesson.sections) {
		lines.push('');
		const kind = section.type === 'READING' ? 'SECTION' : section.type;
		if (section.type === 'DISCUSSION' && section.markdown.trim()) {
			// Written back as its own section so a re-import folds it into the discussion again.
			lines.push(`=== SECTION: ${DISCUSSION_INTRO_TITLE} ===`, '', section.markdown.trim(), '');
		}
		lines.push(`=== ${kind}: ${section.title}${durationLabel(section.durationMinutes)} ===`);
		if (section.summary.trim()) lines.push(`> ${section.summary.trim()}`);
		if (section.type === 'DISCUSSION' && section.discussion) {
			lines.push('', discussionMarkdown(section.discussion));
			continue;
		}
		if (section.keyTakeaways.length) {
			lines.push('', '> [!TAKEAWAYS]', ...section.keyTakeaways.map((item) => `> - ${item}`));
		}
		if (section.markdown.trim()) lines.push('', section.markdown.trim());
	}
	return `${lines.join('\n').trim()}\n`;
}

export function exportCourseMarkdown(lessons: ExportableLesson[]): string {
	return `${lessons.map((lesson) => exportLessonMarkdown(lesson).trim()).join('\n\n')}\n`;
}

export interface ExistingSectionRef {
	id: string;
	title: string;
}

export interface ReplacePlan {
	updates: Array<{ id: string; section: ImportedSection }>;
	creates: ImportedSection[];
	deletes: ExistingSectionRef[];
}

function sameTitle(left: string, right: string): boolean {
	return left.trim().toLocaleLowerCase('vi') === right.trim().toLocaleLowerCase('vi');
}

/** Match by title first, then by leftover position. Callers update rows in place and never recreate them. */
export function planContentReplace(
	existing: ExistingSectionRef[],
	incoming: ImportedSection[],
): ReplacePlan {
	const used = new Set<string>();
	const updates: ReplacePlan['updates'] = [];
	const creates: ImportedSection[] = [];
	const unmatched: ImportedSection[] = [];

	for (const section of incoming) {
		const match = existing.find(
			(item) => !used.has(item.id) && sameTitle(item.title, section.title),
		);
		if (match) {
			used.add(match.id);
			updates.push({ id: match.id, section });
		} else unmatched.push(section);
	}
	const leftovers = existing.filter((item) => !used.has(item.id));
	unmatched.forEach((section, index) => {
		const slot = leftovers[index];
		if (slot) {
			used.add(slot.id);
			updates.push({ id: slot.id, section });
		} else creates.push(section);
	});
	return { updates, creates, deletes: existing.filter((item) => !used.has(item.id)) };
}
