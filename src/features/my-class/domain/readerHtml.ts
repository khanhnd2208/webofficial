export type ReaderHeading = {
	id: string;
	text: string;
	rank: number;
};

export type PreparedReaderHtml = {
	html: string;
	headings: ReaderHeading[];
};

function headingText(inner: string) {
	return inner
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

const HEADING_NUM = /^(\d+(?:\.\d+)+|\d+[.)])\s+/;

function wrapHeadingNumber(inner: string): string {
	if (/\bmc-hnum\b/.test(inner)) return inner;
	const text = headingText(inner);
	const match = text.match(HEADING_NUM);
	if (!match) return inner;
	const token = match[1];
	const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const pattern = new RegExp(`^(\\s*(?:<[^>]+>\\s*)*)${escaped}(?=\\s|<|$)`);
	if (!pattern.test(inner)) return inner;
	return inner.replace(pattern, `$1<span class="mc-hnum">${token}</span>`);
}

function slugifyHeading(text: string, used: Set<string>) {
	const base =
		text
			.normalize('NFC')
			.toLowerCase()
			.replace(/[^\p{L}\p{N}]+/gu, '-')
			.replace(/^-+|-+$/g, '') || 'muc';
	let id = base;
	let n = 2;
	while (used.has(id)) {
		id = `${base}-${n}`;
		n += 1;
	}
	used.add(id);
	return id;
}

/** Normalize heading ranks so the lowest becomes h2, then stamp stable ids for the on-this-page rail. */
export function prepareReaderHtml(value: string): PreparedReaderHtml {
	if (!value) return { html: '', headings: [] };
	const ranks = [...value.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));
	const offset = ranks.length ? 2 - Math.min(...ranks) : 0;
	const used = new Set<string>();
	const headings: ReaderHeading[] = [];
	const html = value.replace(
		/<(\/?)[hH]([1-6])(\b[^>]*)>([\s\S]*?)<\/[hH]\2>/g,
		(full, closing, rank, rest, inner) => {
			if (closing) return full;
			const normalizedRank = Math.min(6, Math.max(2, Number(rank) + offset));
			const text = headingText(String(inner));
			const withoutId = String(rest).replace(/\s+id=(['"]).*?\1/i, '');
			const id = slugifyHeading(text || `muc-${headings.length + 1}`, used);
			if (text && (normalizedRank === 2 || normalizedRank === 3)) {
				headings.push({ id, text, rank: normalizedRank });
			}
			return `<h${normalizedRank}${withoutId} id="${id}">${wrapHeadingNumber(String(inner))}</h${normalizedRank}>`;
		},
	);
	return { html, headings };
}
