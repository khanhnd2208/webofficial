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

export interface ImportedSection {
	title: string;
	durationMinutes: number | null;
	summary: string;
	markdown: string;
	wordCount: number;
}

export interface ImportedLesson {
	lessonTitle: string;
	lessonDescription: string;
	sections: ImportedSection[];
	warnings: string[];
}

const SECTION_DELIMITER_RE =
	/^(?:={3,}|-{3,}|#{2,3})\s*(?:SECTION|MỤC|PHẦN)\s*:\s*(.+?)(?:\s*(?:={3,}|-{3,}))?$/i;

function isPlainQuote(line: string): boolean {
	return line.startsWith('>') && !/^>\s*\[!/.test(line);
}

function parseDuration(raw: string): number | null {
	const match = raw.match(/(\d{1,3})\s*(?:phút|phut|min|minutes?|')/i) ?? raw.match(/^\s*(\d{1,3})\s*$/);
	if (!match) return null;
	const minutes = Number(match[1]);
	return minutes > 0 ? minutes : null;
}

function splitTitleAndDuration(titleLine: string): { title: string; durationMinutes: number | null } {
	let title = titleLine;
	let durationMinutes: number | null = null;
	if (title.includes('|')) {
		const [head, ...rest] = title.split('|');
		title = head;
		durationMinutes = parseDuration(rest.join('|'));
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
	start: number;
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

	const slices: Slice[] = [];
	lines.forEach((line, index) => {
		const match = line.trim().match(SECTION_DELIMITER_RE);
		if (match) slices.push({ titleLine: match[1].trim(), start: index });
	});

	if (!slices.length) {
		lines.forEach((line, index) => {
			if (index !== titleIndex && /^##\s+/.test(line.trim())) {
				slices.push({ titleLine: line.trim().replace(/^##\s+/, ''), start: index });
			}
		});
		if (slices.length) {
			warnings.push(
				'Đã tách mục theo tiêu đề cấp 2 (##). Dùng "=== SECTION: Tiêu đề | 6 phút ===" để kiểm soát chính xác hơn.',
			);
		}
	}

	const bodyStart = Math.max(titleIndex, descriptionIndex) + 1;

	if (!slices.length) {
		const markdown = lines.slice(bodyStart).join('\n').trim();
		warnings.push('Không tìm thấy dấu phân mục. Toàn bộ nội dung được gom thành 1 mục.');
		return {
			lessonTitle: lessonTitle || 'Bài học mới',
			lessonDescription,
			sections: markdown
				? [
						{
							title: lessonTitle || 'Nội dung bài học',
							durationMinutes: null,
							summary: '',
							markdown,
							wordCount: countWords(markdown),
						},
					]
				: [],
			warnings,
		};
	}

	const preamble = lines.slice(bodyStart, slices[0].start).join('\n').trim();
	if (preamble && !lessonDescription) {
		lessonDescription = preamble.split('\n')[0].replace(/^>\s*/, '').trim();
	} else if (preamble) {
		warnings.push('Có đoạn văn trước mục đầu tiên. Đoạn này không được nhập.');
	}

	const sections = slices.map((slice, index): ImportedSection => {
		const end = index + 1 < slices.length ? slices[index + 1].start : lines.length;
		const body = lines.slice(slice.start + 1, end);
		const { title, durationMinutes } = splitTitleAndDuration(slice.titleLine);

		// Summary = a plain `>` quote as the first non-empty line of the section only.
		let summary = '';
		const firstContent = body.findIndex((line) => line.trim());
		if (firstContent >= 0 && isPlainQuote(body[firstContent].trim())) {
			summary = body[firstContent].trim().replace(/^>\s*/, '').trim();
			body.splice(firstContent, 1);
		}

		const markdown = body.join('\n').trim();
		return {
			title: title || `Mục ${index + 1}`,
			durationMinutes,
			summary,
			markdown,
			wordCount: countWords(markdown),
		};
	});

	const empty = sections.filter((section) => !section.markdown).length;
	if (empty) warnings.push(`${empty} mục chưa có nội dung.`);

	return {
		lessonTitle: lessonTitle || (sections[0] ? `Bài học: ${sections[0].title}` : 'Bài học mới'),
		lessonDescription,
		sections,
		warnings,
	};
}

/**
 * Turns raw lecture text (no NDK delimiters) into NDK markdown by promoting academic
 * headings — "I. …", "1. …", "Chương 2: …", "## …" — to section delimiters.
 * The user's text is never rewritten, only wrapped.
 */
export function autoSectionRawText(raw: string, fallbackTitle = 'Bài học mới'): string {
	const trimmed = raw.trim();
	if (!trimmed || /^(?:={3,}|-{3,})\s*(?:SECTION|MỤC|PHẦN)\s*:/im.test(trimmed)) return trimmed;

	const lines = trimmed.replace(/\r\n?/g, '\n').split('\n');
	let lessonTitle = fallbackTitle;
	let skipUntil = 0;
	for (let i = 0; i < Math.min(lines.length, 10); i++) {
		const line = lines[i].trim();
		if (/^#\s+/.test(line)) {
			lessonTitle = line.replace(/^#\s+/, '');
			skipUntil = i + 1;
			if (lines[i + 1] && isPlainQuote(lines[i + 1].trim())) skipUntil = i + 2;
			break;
		}
	}

	const heading =
		/^(?:#{2,3}\s+(.+)|((?:Phần|Chương|Mục|Bài|Tiết)\s+(?:\d+|[IVXLCDM]+|[A-Z])[:.]?\s*.+)|([IVXLCDM]+[.)]\s+\S.+)|(\d+[.)]\s+[A-ZÀ-Ỹ].+))$/u;

	const markers: Array<{ index: number; title: string }> = [];
	for (let i = skipUntil; i < lines.length; i++) {
		const match = lines[i].trim().match(heading);
		if (match) markers.push({ index: i, title: (match[1] ?? match[2] ?? match[3] ?? match[4]).trim() });
	}

	const head = lines.slice(0, skipUntil).join('\n').trim() || `# ${lessonTitle}`;
	if (!markers.length) {
		return `${head}\n\n=== SECTION: Nội dung bài học ===\n\n${lines.slice(skipUntil).join('\n').trim()}`;
	}

	const chunks = [head, ''];
	const preamble = lines.slice(skipUntil, markers[0].index).join('\n').trim();
	if (preamble) chunks.push('=== SECTION: Giới thiệu ===', '', preamble, '');
	markers.forEach((marker, m) => {
		const end = m + 1 < markers.length ? markers[m + 1].index : lines.length;
		chunks.push(`=== SECTION: ${marker.title} ===`, '', lines.slice(marker.index + 1, end).join('\n').trim(), '');
	});
	return chunks.join('\n').trim();
}
