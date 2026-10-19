const OWN_HOSTS = new Set(['toiladuykhanh.com', 'www.toiladuykhanh.com']);

/**
 * A course cover must be a same-site image path. Absolute URLs on this website
 * become that path; anything else is rejected so the card can use default artwork.
 */
export function learnCourseThumbnailSrc(value: string | null | undefined): string | null {
	if (value == null) return null;
	const trimmed = value.trim();
	if (!trimmed || trimmed.length > 2000) return null;

	let pathname = trimmed;
	if (/^https?:\/\//i.test(trimmed)) {
		try {
			const url = new URL(trimmed);
			if (url.protocol !== 'https:' || !OWN_HOSTS.has(url.hostname)) return null;
			pathname = url.pathname;
		} catch {
			return null;
		}
	} else if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
		return null;
	}

	if (!pathname.startsWith('/') || pathname.startsWith('//')) return null;
	if (pathname.includes('\\') || pathname.split('/').includes('..')) return null;
	if (!/\.(avif|gif|jpe?g|png|webp)$/i.test(pathname)) return null;
	return pathname;
}
