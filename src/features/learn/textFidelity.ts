/**
 * Word-level comparison that ignores NDK formatting syntax.
 * The same extractor runs on a Word/Docs paste and on AI markdown, so a faithful
 * reformat compares as identical and any added or dropped word shows up as a hunk.
 */

import { diffArrays } from 'diff';

interface WordChange {
	value: string[];
	added?: boolean;
	removed?: boolean;
}

import { cleanAiPaste } from './lessonImport';

const CONTEXT = 6;
/** Skip Myers when the unaligned middle is large enough to freeze the tab. */
const MAX_DIFF_CELLS = 4_000_000;

const ZERO_WIDTH = /[\u200B-\u200D\uFEFF\u2060\u00AD]/g;

export interface TextHunk {
	kind: 'added' | 'removed';
	words: string[];
	before: string[];
	after: string[];
}

export interface LectureComparison {
	matchPercent: number;
	hunks: TextHunk[];
}

const MERMAID_FENCE_OPEN = /^\s*(`{3,}|~{3,})mermaid\s*$/i;
const RAW_MERMAID_START = /^(?:(?:flowchart|graph)\s+(?:TD|TB|BT|LR|RL)|mindmap|timeline|sequenceDiagram)\b/;
const DOC_BYLINE = /·\s*@\S/;

function stripFormatting(markdown: string, side: 'original' | 'formatted'): string {
	const normalized = markdown.normalize('NFC').replace(ZERO_WIDTH, '');
	const lines = normalized.replace(/\r\n?/g, '\n').split('\n');
	const out: string[] = [];
	let inFence = false;
	let inMermaidFence = false;
	for (let index = 0; index < lines.length; index += 1) {
		const rawLine = lines[index];
		if (side === 'original' && index < 3 && DOC_BYLINE.test(rawLine)) continue;
		if (!inFence && MERMAID_FENCE_OPEN.test(rawLine)) {
			inFence = true;
			inMermaidFence = true;
			continue;
		}
		if (/^\s*(`{3,}|~{3,})/.test(rawLine)) {
			inFence = !inFence;
			inMermaidFence = false;
			continue;
		}
		if (inFence) {
			if (!inMermaidFence) out.push(rawLine);
			continue;
		}
		if (side === 'original' && RAW_MERMAID_START.test(rawLine.trim())) {
			while (index + 1 < lines.length && /^\s+\S/.test(lines[index + 1])) index += 1;
			continue;
		}
		let line = rawLine;
		const section = line
			.trim()
			.match(/^(?:={3,}|-{3,})\s*(?:SECTION|MỤC|PHẦN|QUIZ)\s*:\s*(.+?)\s*(?:={3,}|-{3,})\s*$/i);
		if (section) {
			line = section[1].replace(/\|\s*\d{1,3}\s*(?:phút|phut|min(?:utes)?|giờ|gio|hours?|h)\b[^|]*$/i, '').trim();
		}
		if (/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line) || /^\s*-{3,}\s*$/.test(line)) continue;
		line = line.replace(/\\([\\`*_{}[\]()#+.!|>~-])/g, '$1');
		line = line.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, '$1 $3');
		line = line.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
		line = line.replace(/\[\^(\d+)\]:?/g, ' $1 ');
		line = line.replace(/(?<!\\)\|/g, ' ');
		line = line.replace(/^(?:>\s?)+/, '');
		line = line.replace(/^\[![A-Z]+\]\s*/i, '');
		line = line.replace(/^#{1,6}\s+/, '');
		line = line.replace(/^\s*(?:[-*+]|•|●|▪|–)\s+/, '');
		line = line.replace(/\*\*|__|~~/g, '');
		line = line.replace(/(^|\s)[*_`](?=\S)/g, '$1');
		line = line.replace(/(\S)[*_`](?=\s|$)/g, '$1');
		out.push(line);
	}
	return out.join('\n');
}

/** Content words only: formatting markers removed, NFC, zero-width characters dropped. */
export function lectureWords(markdown: string): string[] {
	return stripFormatting(markdown, 'formatted').split(/\s+/).filter(Boolean);
}

function sameWords(left: string[], right: string[]): boolean {
	if (left.length !== right.length) return false;
	for (let i = 0; i < left.length; i++) if (left[i] !== right[i]) return false;
	return true;
}

function boundedDiff(before: string[], after: string[]): WordChange[] {
	let start = 0;
	const shared = Math.min(before.length, after.length);
	while (start < shared && before[start] === after[start]) start += 1;
	let end = 0;
	while (
		end < shared - start &&
		before[before.length - 1 - end] === after[after.length - 1 - end]
	) {
		end += 1;
	}
	const midBefore = before.slice(start, before.length - end);
	const midAfter = after.slice(start, after.length - end);
	const prefix: WordChange[] = start ? [{ value: before.slice(0, start) }] : [];
	const suffix: WordChange[] = end ? [{ value: before.slice(before.length - end) }] : [];
	if (!midBefore.length && !midAfter.length) return [...prefix, ...suffix];
	if (midBefore.length * midAfter.length > MAX_DIFF_CELLS) {
		const rough: WordChange[] = [];
		if (midBefore.length) rough.push({ value: midBefore, removed: true });
		if (midAfter.length) rough.push({ value: midAfter, added: true });
		return [...prefix, ...rough, ...suffix];
	}
	return [...prefix, ...(diffArrays(midBefore, midAfter) as WordChange[]), ...suffix];
}

function hunksFromChanges(changes: WordChange[]): TextHunk[] {
	const hunks: TextHunk[] = [];
	let indexBefore = 0;
	let indexAfter = 0;
	const beforeWords: string[] = [];
	const afterWords: string[] = [];
	for (const change of changes) {
		const words = change.value;
		if (change.removed) beforeWords.push(...words);
		else if (change.added) afterWords.push(...words);
		else {
			beforeWords.push(...words);
			afterWords.push(...words);
		}
	}
	for (const change of changes) {
		const words = change.value;
		if (!change.added && !change.removed) {
			indexBefore += words.length;
			indexAfter += words.length;
			continue;
		}
		if (change.removed) {
			hunks.push({
				kind: 'removed',
				words,
				before: beforeWords.slice(Math.max(0, indexBefore - CONTEXT), indexBefore),
				after: beforeWords.slice(indexBefore + words.length, indexBefore + words.length + CONTEXT),
			});
			indexBefore += words.length;
			continue;
		}
		hunks.push({
			kind: 'added',
			words,
			before: afterWords.slice(Math.max(0, indexAfter - CONTEXT), indexAfter),
			after: afterWords.slice(indexAfter + words.length, indexAfter + words.length + CONTEXT),
		});
		indexAfter += words.length;
	}
	return hunks;
}

/** Shared word diff for history, replace preview, and the session bar. */
export function wordDiff(before: string, after: string): TextHunk[] {
	const left = lectureWords(before);
	const right = lectureWords(after);
	if (sameWords(left, right)) return [];
	return hunksFromChanges(boundedDiff(left, right));
}

/**
 * A removed hunk followed by an added hunk is one place (a substitution).
 * A lone insert or delete is also one place.
 */
export function countPlaces(hunks: TextHunk[]): number {
	let count = 0;
	for (let i = 0; i < hunks.length; i++) {
		count += 1;
		if (hunks[i].kind === 'removed' && hunks[i + 1]?.kind === 'added') i += 1;
	}
	return count;
}

function sameWordsIgnoreCase(left: string[], right: string[]): boolean {
	if (left.length !== right.length) return false;
	for (let i = 0; i < left.length; i += 1) {
		if (left[i].toLocaleLowerCase('vi') !== right[i].toLocaleLowerCase('vi')) return false;
	}
	return true;
}

/** A Docs byline was dropped. Ignore the new description only when those words already exist in the lecture. */
function withoutBylineReplacement(original: string, formatted: string): string {
	const head = original.replace(/\r\n?/g, '\n').split('\n').slice(0, 3);
	if (!head.some((line) => DOC_BYLINE.test(line))) return formatted;
	const lines = formatted.replace(/\r\n?/g, '\n').split('\n');
	const index = lines.findIndex((line, i) => i < 5 && /^>\s+\S/.test(line) && !/^>\s*\[!/.test(line));
	if (index < 0) return formatted;
	const description = stripFormatting(lines[index], 'formatted').split(/\s+/).filter(Boolean);
	const source = stripFormatting(original, 'original').split(/\s+/).filter(Boolean);
	const found = source.some((_, start) => sameWordsIgnoreCase(source.slice(start, start + description.length), description));
	if (!found) return formatted;
	lines.splice(index, 1);
	return lines.join('\n');
}

/** Compare a source lecture with AI output. Outer ```markdown fences are ignored. */
export function compareLectureText(original: string, formatted: string): LectureComparison {
	const cleanedOriginal = cleanAiPaste(original).markdown;
	const cleanedFormatted = cleanAiPaste(formatted).markdown;
	const left = stripFormatting(cleanedOriginal, 'original').split(/\s+/).filter(Boolean);
	const right = stripFormatting(withoutBylineReplacement(cleanedOriginal, cleanedFormatted), 'formatted').split(/\s+/).filter(Boolean);
	if (sameWords(left, right)) return { matchPercent: 100, hunks: [] };
	const hunks = hunksFromChanges(boundedDiff(left, right));
	const changed = hunks.reduce((sum, hunk) => sum + hunk.words.length, 0);
	const base = Math.max(left.length + right.length, 1);
	return { matchPercent: Math.max(0, Math.round((1 - changed / base) * 100)), hunks };
}
