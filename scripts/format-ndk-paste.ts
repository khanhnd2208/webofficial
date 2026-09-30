/**
 * Wraps a Docs-style lecture paste in NDK markdown without changing words.
 * Usage: npx tsx scripts/format-ndk-paste.ts <original.txt> <out.md> [--discussion]
 */
import { readFileSync, writeFileSync } from 'node:fs';

import { compareLectureText } from '../src/features/learn/textFidelity';
import { parseCourseMarkdown } from '../src/features/learn/lessonImport';

const SECTION_RE = /^(Mở đầu:.*|Phần \d+\..*|Góc đọc thêm|Tổng kết.*|Cách dùng bộ câu hỏi.*)$/;

const SUBHEAD_RE =
	/^(?:\d+\.\d+\..+|(?:Một hiểu lầm|Về cách tôi viết|Bản đồ bài học|Nhóm [A-Z]:|Câu hỏi tự kiểm tra|Bài tập thực hành|Bảng từ khóa|Từ khóa|Ghi nhớ trong \d+ dòng).*|(?:Thay đổi|Lý do) \d+[:.].*)$/;

const CALLOUT: Array<{ re: RegExp; kind: string }> = [
	{ re: /^(Câu dễ nhớ)\s*:\s*(.*)$/, kind: 'TIP' },
	{ re: /^(Mẹo nhớ)\s*:\s*(.*)$/, kind: 'TIP' },
	{
		re: /^(Liên hệ bản thân|Hãy tự hỏi|Câu hỏi nhanh cho bạn|Thử sức)\s*:\s*(.*)$/,
		kind: 'REFLECT',
	},
	{ re: /^(Lưu ý quan trọng|Lưu ý)\s*:\s*(.*)$/, kind: 'WARNING' },
	{ re: /^(Lưu ý về từ ngữ|Đọc thêm)\s*:\s*(.*)$/, kind: 'NOTE' },
	{ re: /^(Một hiểu lầm cần bỏ(?: ngay)?)\s*:\s*(.*)$/, kind: 'IMPORTANT' },
	{ re: /^(Ví dụ(?: tổng hợp)?[^:]*)\s*:\s*(.*)$/, kind: 'EXAMPLE' },
];

function isShort(line: string): boolean {
	const t = line.trim();
	if (!t || t.startsWith('flowchart') || t.startsWith('```') || t.endsWith(':')) return false;
	if (/^\d+\.\s/.test(t)) return false;
	if (/^(Mười |Trải nghiệm |Câu hỏi tự kiểm tra|Bài tập |Ghi nhớ |Bảng từ khóa|Từ khóa$)/.test(t))
		return false;
	if (t.length > 180) return false;
	if (t.length > 90 && /[.!?…]$/.test(t)) return false;
	return true;
}

function mermaidBlock(lines: string[], i: number): { block: string[]; next: number } | null {
	if (!/^(?:flowchart|graph)\s+(?:TD|TB|LR|RL)\b/.test(lines[i].trim())) return null;
	const block = [lines[i]];
	let j = i + 1;
	while (j < lines.length && (/^\s+\S/.test(lines[j]) || lines[j].trim() === '')) {
		if (lines[j].trim() === '') break;
		block.push(lines[j]);
		j += 1;
	}
	return { block, next: j };
}

function tableAt(lines: string[], i: number): { markdown: string; next: number } | null {
	if (!isShort(lines[i] ?? '')) return null;
	const cells: string[] = [];
	let j = i;
	while (
		j < lines.length &&
		isShort(lines[j]) &&
		!SECTION_RE.test(lines[j].trim()) &&
		!/^\d+\.\d+\./.test(lines[j].trim())
	) {
		cells.push(lines[j].trim());
		j += 1;
		if (cells.length >= 80) break;
	}
	if (cells.length < 6) return null;
	for (const cols of [4, 3, 5, 2]) {
		if (cells.length % cols !== 0) continue;
		const rows = cells.length / cols;
		if (rows < 2) continue;
		const header = cells.slice(0, cols);
		if (header.some((cell) => cell.length > 28 || cell.includes('('))) continue;
		const body = cells.slice(cols);
		const md = [
			`| ${header.join(' | ')} |`,
			`| ${header.map(() => '---').join(' | ')} |`,
			...Array.from(
				{ length: rows - 1 },
				(_, r) => `| ${body.slice(r * cols, (r + 1) * cols).join(' | ')} |`,
			),
		].join('\n');
		return { markdown: md, next: j };
	}
	return null;
}

function callout(line: string): string | null {
	const trimmed = line.trim();
	for (const { re, kind } of CALLOUT) {
		const match = trimmed.match(re);
		if (!match) continue;
		const title = match[1];
		const rest = match[2]?.trim() ?? '';
		return rest ? `> [!${kind}] ${title}:\n> ${rest}` : `> [!${kind}] ${title}:`;
	}
	return null;
}

function boldLead(line: string): string {
	return line.replace(/^((?:Lý do|Thay đổi) \d+\s*[—–-])\s+/, '**$1** ');
}

export function formatLecture(raw: string): string {
	const lines = raw.replace(/\r\n?/g, '\n').split('\n');
	const title = lines.find((line) => /^Bài \d+ — /.test(line.trim()))?.trim() ?? 'Bài học';
	const out: string[] = [`# ${title}`, ''];
	let i = 0;
	while (i < lines.length && !/^Bài \d+ — /.test(lines[i].trim())) i += 1;
	i += 1;
	if (i < lines.length && /·\s*@/.test(lines[i])) i += 1;

	let started = false;
	const push = (chunk: string) => {
		if (!chunk.trim()) return;
		if (out[out.length - 1] !== '') out.push('');
		out.push(chunk);
	};

	while (i < lines.length) {
		const line = lines[i];
		const trimmed = line.trim();
		if (!trimmed) {
			i += 1;
			continue;
		}
		if (/^Câu hỏi phản biện/.test(trimmed)) break;

		const diagram = mermaidBlock(lines, i);
		if (diagram) {
			push(`\`\`\`mermaid\n${diagram.block.map((row) => row.trimEnd()).join('\n')}\n\`\`\``);
			i = diagram.next;
			continue;
		}

		if (SECTION_RE.test(trimmed)) {
			push(`=== SECTION: ${trimmed} ===`);
			started = true;
			i += 1;
			continue;
		}

		if (!started) {
			push(`=== SECTION: ${trimmed} ===`);
			started = true;
			i += 1;
			continue;
		}

		if (SUBHEAD_RE.test(trimmed) || (/^\d+\.\d+\.\s+\S/.test(trimmed) && trimmed.length < 120)) {
			push(`## ${trimmed}`);
			i += 1;
			continue;
		}

		const boxed = callout(trimmed);
		if (boxed) {
			push(boxed);
			i += 1;
			continue;
		}

		const table = tableAt(lines, i);
		if (table) {
			push(table.markdown);
			i = table.next;
			continue;
		}

		push(boldLead(trimmed));
		i += 1;
	}

	return `${out.join('\n').trim()}\n`;
}

function quoteBlock(kind: string, title: string, body: string[]): string {
	const lines = [
		`> [!${kind}] ${title}`,
		...body.filter((line) => line.trim()).map((line) => `> ${line.trim()}`),
	];
	return lines.join('\n');
}

/** Discussion paste → NDK. "Đáp án mẫu:" and "Câu n:" are parser labels; word check uses questions mode. */
export function formatDiscussion(raw: string): string {
	const lines = raw
		.replace(/\r\n?/g, '\n')
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
	const discTitle = lines.find((line) => /^Câu hỏi phản biện/.test(line)) ?? 'Câu hỏi phản biện';
	const start = lines.findIndex((line) => /^Cách dùng bộ câu hỏi/.test(line));
	const body = start >= 0 ? lines.slice(start) : lines.filter((line) => line !== discTitle);
	const out: string[] = ['=== SECTION: Cách dùng bộ câu hỏi ===', ''];
	const questionsAt = body.findIndex((line) => /^Câu \d+\s*·/.test(line));
	const guideEnd = body.findIndex(
		(line, index) => index > 0 && (/^Phần \d+/.test(line) || /^Câu \d+\s*·/.test(line)),
	);
	const guide = body.slice(
		1,
		guideEnd >= 0 ? guideEnd : questionsAt >= 0 ? questionsAt : body.length,
	);
	for (let g = 0; g < guide.length; g += 1) {
		const table = tableAt(guide, g);
		if (table) {
			out.push(table.markdown, '');
			g = table.next - 1;
			continue;
		}
		if (/^Danh sách câu hỏi$/.test(guide[g])) {
			out.push(`## ${guide[g]}`, '');
			continue;
		}
		if (/^Phần \d+/.test(guide[g])) out.push(`## ${guide[g]}`, '');
		else if (/^[-•]\s+/.test(guide[g])) out.push(guide[g].replace(/^[•]\s+/, '- '), '');
		else out.push(guide[g], '');
	}
	out.push(`=== DISCUSSION: ${discTitle} ===`, '');
	const sliceFrom = guideEnd >= 0 ? guideEnd : questionsAt;
	const questions = sliceFrom >= 0 ? body.slice(sliceFrom) : [];
	let q = 0;
	while (q < questions.length) {
		const head = questions[q].match(/^Câu (\d+)\s*·\s*(.*)$/);
		if (!head) {
			if (/^Phần /.test(questions[q]) || /^Câu tổng hợp$/.test(questions[q]))
				out.push(`## ${questions[q]}`, '');
			q += 1;
			continue;
		}
		const number = head[1];
		out.push(`Câu ${number}:`, `### ${questions[q]}`, '');
		q += 1;
		const buckets: Record<string, string[]> = {
			situation: [],
			ask: [],
			recall: [],
			steps: [],
			takeaway: [],
			other: [],
		};
		let bucket: keyof typeof buckets = 'other';
		const stepHeads: string[] = [];
		while (
			q < questions.length &&
			!/^Câu \d+\s*·/.test(questions[q]) &&
			!/^Phần \d+/.test(questions[q]) &&
			!/^Câu tổng hợp$/.test(questions[q])
		) {
			const line = questions[q];
			if (/^Tình huống\s*:/.test(line)) {
				bucket = 'situation';
				const rest = line.replace(/^Tình huống\s*:\s*/, '');
				if (rest) buckets.situation.push(rest);
			} else if (/^Câu hỏi\s*:/.test(line)) {
				bucket = 'ask';
				const rest = line.replace(/^Câu hỏi\s*:\s*/, '');
				if (rest) buckets.ask.push(rest);
			} else if (/^Nhắc lại bài học\s*:/.test(line)) {
				bucket = 'recall';
				const rest = line.replace(/^Nhắc lại bài học\s*:\s*/, '');
				if (rest) buckets.recall.push(rest);
			} else if (/^Cùng suy nghĩ từng bước\s*:/.test(line)) {
				bucket = 'steps';
				const rest = line.replace(/^Cùng suy nghĩ từng bước\s*:\s*/, '');
				if (rest) buckets.steps.push(rest);
			} else if (/^Điều rút ra\s*:/.test(line)) {
				bucket = 'takeaway';
				const rest = line.replace(/^Điều rút ra\s*:\s*/, '');
				if (rest) buckets.takeaway.push(rest);
			} else if (/^Bước \d+/.test(line)) {
				bucket = 'steps';
				const step = line.match(/^(Bước \d+\.)\s+(.*)$/);
				stepHeads.push(step?.[1] ?? line);
				buckets.steps.push(`@@STEP@@${step?.[1] ?? line}`);
				if (step?.[2]) buckets.steps.push(step[2]);
			} else {
				buckets[bucket].push(line);
			}
			q += 1;
		}
		if (buckets.situation.length)
			out.push(quoteBlock('EXAMPLE', 'Tình huống:', buckets.situation), '');
		if (buckets.ask.length) out.push(quoteBlock('REFLECT', 'Câu hỏi:', buckets.ask), '');
		out.push('Đáp án mẫu:', '');
		if (buckets.recall.length) out.push('### Nhắc lại bài học:', ...buckets.recall, '');
		if (buckets.steps.length || stepHeads.length) {
			out.push('### Cùng suy nghĩ từng bước:');
			for (const line of buckets.steps) {
				if (line.startsWith('@@STEP@@')) out.push('', `#### ${line.slice('@@STEP@@'.length)}`);
				else out.push('', line);
			}
			out.push('');
		}
		if (buckets.takeaway.length)
			out.push(quoteBlock('IMPORTANT', 'Điều rút ra:', buckets.takeaway), '');
		if (buckets.other.length) out.push(...buckets.other, '');
	}
	return `${out.join('\n').trim()}\n`;
}

function main() {
	const [input, output, flag] = process.argv.slice(2);
	if (!input || !output) {
		console.error(
			'Usage: npx tsx scripts/format-ndk-paste.ts <original.txt> <out.md> [--discussion]',
		);
		process.exitCode = 1;
		return;
	}
	const original = readFileSync(input, 'utf8');
	const formatted = flag === '--discussion' ? formatDiscussion(original) : formatLecture(original);
	const fidelity = compareLectureText(original, formatted, { questions: flag === '--discussion' });
	const parsed = parseCourseMarkdown(formatted);
	writeFileSync(output, formatted);
	console.log(
		JSON.stringify({
			matchPercent: fidelity.matchPercent,
			hunks: fidelity.hunks.length,
			firstHunk: fidelity.hunks[0] ?? null,
			lessons: parsed.lessons.map((lesson) => ({
				title: lesson.lessonTitle,
				sections: lesson.sections.map((section) => ({
					type: section.type,
					title: section.title,
					words: section.wordCount,
				})),
			})),
			warnings: parsed.warnings,
		}),
	);
	if (fidelity.hunks.length || parsed.warnings.length) process.exitCode = 2;
}

if (process.argv[1]?.includes('format-ndk-paste')) main();
