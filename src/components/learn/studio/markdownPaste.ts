import { cleanAiPaste } from '@/features/learn/lessonImport';

/** Block syntax that only Markdown source has; one of these makes a plain-text paste Markdown. */
const MARKDOWN_SIGNS = [
	/^#{1,6}\s+\S/m,
	/^>\s*\[![A-Za-z]+\]/m,
	/^\|?\s*:?-{3,}:?\s*\|/m,
	/^\s{0,3}(`{3,}|~{3,})/m,
	/!\[[^\]\n]*\]\([^)\n]*\)/,
	/\*\*[^*\n]+\*\*/,
	/\[[^\]\n]+\]\((?:https?:\/\/|\/)[^)\s]+\)/,
	/^\s*(?:[-*+]|\d{1,2}[.)])\s+\S[^\n]*\n\s*(?:[-*+]|\d{1,2}[.)])\s+\S/m,
];

/** Rich HTML already carries the structure; only code editors and plain sources need parsing. */
const STRUCTURED_HTML_RE = /<(?:h[1-6]|ul|ol|li|table|blockquote|strong|b|em|i|img|a)\b/i;

/**
 * Markdown to insert for a paste into the visual editor, or null for the default paste.
 * Copying from a .md file, VS Code or an AI chat gives Markdown as plain text; without this
 * it lands as literal "##", "> [!NOTE]" and broken table rows.
 */
export function markdownFromPaste(text: string, html: string): string | null {
	if (!text.trim() || STRUCTURED_HTML_RE.test(html)) return null;
	const markdown = cleanAiPaste(text).markdown;
	return MARKDOWN_SIGNS.some((sign) => sign.test(markdown)) ? markdown : null;
}
