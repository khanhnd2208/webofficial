/** Image width lives in a URL fragment so the markdown stays valid and AI-writable. */

export type ImageWidth = 50 | 75 | 100;

const WIDTH_RE = /#w=(50|75|100)$/i;
const OWN_HOSTS = new Set(['toiladuykhanh.com', 'www.toiladuykhanh.com']);

export function splitImageSrc(src: string): { url: string; width: ImageWidth | null } {
	const match = src.match(WIDTH_RE);
	if (!match || match.index === undefined) return { url: src, width: null };
	const width = Number(match[1]) as ImageWidth;
	return { url: src.slice(0, match.index), width: width === 100 ? null : width };
}

export function joinImageSrc(url: string, width: ImageWidth | null): string {
	const clean = url.replace(WIDTH_RE, '');
	if (!width || width === 100) return clean;
	return `${clean}#w=${width}`;
}

/** True when a learner page would block this image under img-src 'self'. */
export function isExternalImageSrc(src: string): boolean {
	const { url } = splitImageSrc(src.trim());
	if (!/^https?:\/\//i.test(url)) return false;
	try {
		return !OWN_HOSTS.has(new URL(url).hostname);
	} catch {
		return true;
	}
}

export function findExternalImages(markdown: string): string[] {
	const found: string[] = [];
	const re = /!\[[^\]]*]\(\s*<?([^)\s>]+)>?/g;
	for (const match of markdown.matchAll(re)) {
		if (isExternalImageSrc(match[1])) found.push(splitImageSrc(match[1]).url);
	}
	return found;
}
