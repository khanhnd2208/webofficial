/**
 * Finds places in pasted text that refer to a picture but have no image slot yet:
 * a caption line such as "Hình 2.1: Quy trình" or a note such as "[Chèn hình minh họa]".
 * Copying from Word, Docs or a PDF keeps those lines and drops the picture; a Claude Doc
 * export leaves "[embedded content: …]" where each diagram was.
 */

import { findImageRefs } from './images';

export type ImageHintKind = 'caption' | 'placeholder';

export interface ImageHint {
	/** 0-based line in the markdown. */
	line: number;
	kind: ImageHintKind;
	/** Text for the new slot's alt, shown as the slot name in the image picker. */
	alt: string;
}

const PICTURE_WORD = String.raw`(?:hình(?:\s+ảnh)?|ảnh|sơ\s+đồ|biểu\s+đồ|minh\s+họa|figure|fig\.?|image|picture|photo)`;
const CAPTION_RE = new RegExp(
	String.raw`^${PICTURE_WORD}\s*\d+(?:[.\-–]\d+)*\s*[:.–—-]\s*\S.{0,200}$`,
	'iu',
);
const PLACEHOLDER_RE = new RegExp(
	String.raw`^[[(<]\s*(?:chèn\s+|thêm\s+|insert\s+)?${PICTURE_WORD}(?=[\s:.,\])>-])[^\]()<>]{0,200}[\])>]$`,
	'iu',
);
const EMBEDDED_RE = /^\[\s*embedded\s+content\s*:\s*([^\]]*?)\s*\]$/iu;
const EMPHASIS_RE = /^([*_]{1,3})(.+)\1$/u;

/** Markdown source writes the brackets as "&#91;" or "\[ … \]"; the visual editor shows plain ones. */
function unescapeBrackets(line: string): string {
	return line.replace(/&#91;|&lsqb;|\\\[/giu, '[').replace(/&#93;|&rsqb;|\\\]/giu, ']');
}

/** What a standalone paragraph would become as an image slot, or null when it is ordinary text. */
export function imageHintFor(text: string): { kind: ImageHintKind; alt: string } | null {
	let line = text.normalize('NFC').trim();
	line = line.match(EMPHASIS_RE)?.[2].trim() ?? line;
	const plain = unescapeBrackets(line);
	const embedded = plain.match(EMBEDDED_RE);
	if (embedded) return { kind: 'placeholder', alt: embedded[1] };
	if (CAPTION_RE.test(line)) return { kind: 'caption', alt: line };
	if (PLACEHOLDER_RE.test(plain)) return { kind: 'placeholder', alt: plain.slice(1, -1).trim() };
	return null;
}

function isFence(line: string): boolean {
	return /^\s{0,3}(`{3,}|~{3,})/.test(line);
}

/** A picture, diagram or code block right next to the caption already illustrates it. */
function isFigure(line: string | undefined): boolean {
	return line !== undefined && (isFence(line) || findImageRefs(line).length > 0);
}

const FIGURE_NUMBER_RE = new RegExp(String.raw`${PICTURE_WORD}\s*(\d+(?:[.\-–]\d+)*)`, 'iu');

/** The "2.1" of "Hình 2.1"; other digits, as in "ba tầng · 3 cấp", are not a figure number. */
function figureNumber(alt: string): string | null {
	return alt.match(FIGURE_NUMBER_RE)?.[1] ?? null;
}

/** "[Hình 3]" beside "Hình 2: …" is two pictures; a note without a number belongs to the caption. */
function sameFigureNumber(left: string, right: string): boolean {
	const [a, b] = [figureNumber(left), figureNumber(right)];
	return !a || !b || a === b;
}

/**
 * A note right next to its caption ("[Hình 2]" then "Hình 2: Chu trình") is one picture:
 * the note becomes the slot, named after the caption, and the caption stays as text.
 */
export function pairNotesWithCaptions<T extends { kind: ImageHintKind; alt: string }>(
	hints: T[],
	adjacent: (first: T, second: T) => boolean,
): T[] {
	const paired: T[] = [];
	for (const hint of hints) {
		const previous = paired.at(-1);
		if (
			previous &&
			previous.kind !== hint.kind &&
			adjacent(previous, hint) &&
			sameFigureNumber(previous.alt, hint.alt)
		) {
			const [note, caption] = previous.kind === 'placeholder' ? [previous, hint] : [hint, previous];
			paired[paired.length - 1] = { ...note, alt: caption.alt };
			continue;
		}
		paired.push(hint);
	}
	return paired;
}

/** Only paragraphs of their own count, so the visual editor finds exactly the same places. */
export function findImageHints(markdown: string): ImageHint[] {
	const lines = markdown.split('\n');
	const hints: ImageHint[] = [];
	let fenced = false;
	lines.forEach((line, index) => {
		if (isFence(line)) {
			fenced = !fenced;
			return;
		}
		if (fenced || /^\s{4,}|^\s*>/.test(line)) return;
		if (lines[index - 1]?.trim() || lines[index + 1]?.trim()) return;
		const hint = imageHintFor(line);
		if (!hint) return;
		const above = lines
			.slice(0, index)
			.reverse()
			.find((item) => item.trim());
		const below = lines.slice(index + 1).find((item) => item.trim());
		if (isFigure(above) || isFigure(below)) return;
		hints.push({ line: index, ...hint });
	});
	return pairNotesWithCaptions(hints, (first, second) =>
		lines.slice(first.line + 1, second.line).every((line) => !line.trim()),
	);
}

export function imageSlotMarkdown(alt: string): string {
	return `![${alt.replace(/[\\[\]]/g, '\\$&')}]()`;
}

/** Captions keep their line and get an empty slot above; placeholder notes become the slot. */
export function addImageSlots(markdown: string): string {
	const lines = markdown.split('\n');
	for (const hint of findImageHints(markdown).reverse()) {
		const slot = imageSlotMarkdown(hint.alt);
		if (hint.kind === 'placeholder') lines[hint.line] = slot;
		else lines.splice(hint.line, 0, slot, '');
	}
	return lines.join('\n');
}
