/**
 * Lectures pasted from Word or chat often mark list items with a typed "•" and a blank line
 * between items. Markdown reads those lines as separate paragraphs, so the reader shows loose
 * text instead of a list. Rewrite them as a real, tight Markdown list before rendering.
 * Fenced code is left alone.
 */
const TYPED_BULLET = /^(\s{0,3})[•●▪◦]\s+(.*)$/;
const FENCE = /^\s{0,3}(`{3,}|~{3,})/;

export function normalizeTypedBullets(markdown: string): string {
	if (!/[•●▪◦]/.test(markdown)) return markdown;
	const lines = markdown.split('\n');
	const out: string[] = [];
	let fence: string | null = null;
	for (let index = 0; index < lines.length; index++) {
		const line = lines[index];
		const fenceMatch = FENCE.exec(line);
		if (fenceMatch) {
			const marker = fenceMatch[1][0];
			if (fence === null) fence = marker;
			else if (fence === marker) fence = null;
			out.push(line);
			continue;
		}
		if (fence !== null) {
			out.push(line);
			continue;
		}
		const bullet = TYPED_BULLET.exec(line);
		if (!bullet) {
			out.push(line);
			continue;
		}
		const previous = out.length ? out[out.length - 1] : '';
		// A list right after a paragraph needs a blank line so it is not read as one block.
		if (previous.trim() && !/^\s*[-*+]\s/.test(previous)) out.push('');
		out.push(`${bullet[1]}- ${bullet[2]}`);
		// Drop blank lines between two typed bullets so the list stays tight.
		let next = index + 1;
		while (next < lines.length && !lines[next].trim()) next++;
		if (next > index + 1 && next < lines.length && TYPED_BULLET.test(lines[next])) {
			index = next - 1;
		}
	}
	return out.join('\n');
}
