import DOMPurify from 'isomorphic-dompurify';

const HTML_PROFILE = { USE_PROFILES: { html: true } } as const;

export function sanitizeMyClassHtml(html: string | null | undefined): string {
	if (!html) return '';
	return DOMPurify.sanitize(html, HTML_PROFILE);
}
