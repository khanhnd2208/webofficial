/**
 * Split a card's stored answer HTML into the point to remember and its example,
 * so the battle can show them as two blocks. The example starts at the first
 * top-level paragraph that opens with "Example:" / "Ví dụ:" (bold or not); that
 * label is dropped because the block carries its own heading.
 */

const EXAMPLE_START =
	/<p\b[^>]*>\s*(?:<(strong|b)\b[^>]*>\s*)?(?:for example|example|e\.g\.|ví dụ|vd)\s*(?:<\/\1>\s*)?[:.]\s*(?:<\/\1>\s*)?/i;

export type AnswerParts = { main: string; example: string };

export function splitAnswerExample(html: string): AnswerParts {
	const match = EXAMPLE_START.exec(html);
	if (!match || match.index === 0) return { main: html, example: '' };
	const main = html.slice(0, match.index).trim();
	const opening = /^<p\b[^>]*>/i.exec(match[0])![0];
	const example = `${opening}${html.slice(match.index + match[0].length)}`.trim();
	return { main, example };
}
