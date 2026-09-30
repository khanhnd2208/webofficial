import DOMPurify from 'isomorphic-dompurify';

const HTML_PROFILE = { USE_PROFILES: { html: true } } as const;

export function sanitizeTeachingHtml(html: string | null | undefined): string {
	if (!html) return '';
	return DOMPurify.sanitize(html, HTML_PROFILE);
}

/**
 * Treat formatting-only markup such as `<p><br></p>` as empty while allowing
 * uploaded images to be published as standalone note content.
 */
export function hasTeachingHtmlContent(html: string | null | undefined): boolean {
	const sanitized = sanitizeTeachingHtml(html);
	if (/<img\b/i.test(sanitized)) return true;

	return (
		sanitized
			.replace(/<[^>]*>/g, ' ')
			.replace(/&(nbsp|#0*160|#x0*a0);/gi, ' ')
			.replace(/[\s\u00a0\u200b-\u200d\ufeff]/g, '').length > 0
	);
}
