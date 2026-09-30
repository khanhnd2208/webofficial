/**
 * NDK callouts: `> [!KIND] Optional title` blockquotes inside section markdown.
 * Shared by the reader (remark plugin) and the studio editor (Tiptap node) so both
 * accept the same aliases and write back the same canonical tag.
 */

export const CALLOUT_KINDS = [
	'definition',
	'quote',
	'example',
	'reflect',
	'note',
	'tip',
	'warning',
	'important',
] as const;

export type CalloutKind = (typeof CALLOUT_KINDS)[number];

export const CALLOUT_LABELS: Record<CalloutKind, string> = {
	definition: 'Định nghĩa',
	quote: 'Trích dẫn',
	example: 'Ví dụ',
	reflect: 'Suy ngẫm',
	note: 'Ghi chú',
	tip: 'Gợi ý',
	warning: 'Lưu ý',
	important: 'Cốt lõi',
};

const ALIASES: Record<string, CalloutKind> = {
	DEFINITION: 'definition',
	'ĐỊNH NGHĨA': 'definition',
	'KHÁI NIỆM': 'definition',
	'THUẬT NGỮ': 'definition',
	QUOTE: 'quote',
	'TRÍCH DẪN': 'quote',
	'DANH NGÔN': 'quote',
	EXAMPLE: 'example',
	CASE: 'example',
	'VÍ DỤ': 'example',
	'THỰC TIỄN': 'example',
	'TRƯỜNG HỢP': 'example',
	REFLECT: 'reflect',
	QUESTION: 'reflect',
	'THẢO LUẬN': 'reflect',
	'SUY NGẪM': 'reflect',
	'CÂU HỎI': 'reflect',
	NOTE: 'note',
	INFO: 'note',
	'LƯU Ý': 'note',
	TIP: 'tip',
	MẸO: 'tip',
	'GỢI Ý': 'tip',
	WARNING: 'warning',
	CAUTION: 'warning',
	DANGER: 'warning',
	'CẢNH BÁO': 'warning',
	'PHÊ PHÁN': 'warning',
	IMPORTANT: 'important',
	'QUAN TRỌNG': 'important',
	'CỐT LÕI': 'important',
};

/** Matches the marker at the start of a callout's first line: `[!KIND] title`. */
export const CALLOUT_MARKER_RE = /^\s*\[!([^\]\n]{1,24})\][ \t]*([^\n]*)/;

export function resolveCalloutKind(tag: string): CalloutKind | null {
	return ALIASES[tag.trim().toLocaleUpperCase('vi')] ?? null;
}

export function isCalloutKind(value: unknown): value is CalloutKind {
	return typeof value === 'string' && (CALLOUT_KINDS as readonly string[]).includes(value);
}

/** Canonical markdown tag written by the editor, e.g. `DEFINITION`. */
export function calloutTag(kind: CalloutKind): string {
	return kind.toUpperCase();
}
