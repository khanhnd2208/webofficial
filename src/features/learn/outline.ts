/** Headings inside one section, used for the "Trong mục này" list. */

export interface ReadingHeading {
	level: 2 | 3 | 4;
	text: string;
	id: string;
}

export function headingId(text: string): string {
	const slug = text
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/đ/gi, 'd')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
	return slug || 'muc';
}

export function readingOutline(markdown: string): ReadingHeading[] {
	const headings: ReadingHeading[] = [];
	let fence = false;
	for (const line of markdown.split('\n')) {
		if (/^\s*(`{3,}|~{3,})/.test(line)) {
			fence = !fence;
			continue;
		}
		if (fence) continue;
		const match = /^(#{2,4})\s+(.+)$/.exec(line.trim());
		if (!match) continue;
		const text = match[2].replace(/[*_`]/g, '').trim();
		headings.push({ level: match[1].length as 2 | 3 | 4, text, id: headingId(text) });
	}
	return headings;
}
