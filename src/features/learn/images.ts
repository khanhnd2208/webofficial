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

export type ImageSrcStatus = 'ready' | 'external' | 'missing';

export function imageSrcStatus(src: string): ImageSrcStatus {
	const { url } = splitImageSrc(src.trim());
	if (url.startsWith('/') && !url.startsWith('//')) return 'ready';
	if (/^https?:\/\//i.test(url) || url.startsWith('//')) {
		try {
			const parsed = new URL(url, 'https://toiladuykhanh.com');
			if (!OWN_HOSTS.has(parsed.hostname)) return 'external';
			return parsed.protocol === 'https:' ? 'ready' : 'missing';
		} catch {
			return 'missing';
		}
	}
	return 'missing';
}

export interface ImageRef {
	src: string;
	url: string;
	alt: string;
	status: ImageSrcStatus;
}

/** Mask code without moving offsets, so examples are never uploaded or rewritten. */
function maskCode(markdown: string): string {
	let fence: { char: string; length: number } | null = null;
	return markdown
		.split(/(?<=\n)/)
		.map((line) => {
			const match = line.match(/^\s{0,3}(`{3,}|~{3,})/);
			const inFence = Boolean(fence);
			if (match) {
				if (!fence) fence = { char: match[1][0], length: match[1].length };
				else if (match[1][0] === fence.char && match[1].length >= fence.length) fence = null;
			}
			if (inFence || match) return line.replace(/[^\n]/g, ' ');
			return line.replace(/(`+)[\s\S]*?\1/g, (code) => ' '.repeat(code.length));
		})
		.join('');
}

// Inline image destinations, including angle brackets, titles and balanced parentheses.
const IMAGE_RE =
	/!\[((?:\\.|[^\]\\])*)\]\(\s*(?:<([^>\n]*)>|([^\s()]*(?:\([^()\s]*\)[^\s()]*)*))(?:\s+["'][^\n]*?["'])?\s*\)/g;

function imageMatches(markdown: string) {
	return [...maskCode(markdown).matchAll(IMAGE_RE)].filter((match) => {
		let escapes = 0;
		for (let i = match.index - 1; i >= 0 && markdown[i] === '\\'; i--) escapes++;
		return escapes % 2 === 0;
	});
}

export function findImageRefs(markdown: string): ImageRef[] {
	return imageMatches(markdown).map((match) => {
		const src = match[2] ?? match[3];
		return { src, url: splitImageSrc(src).url, alt: match[1], status: imageSrcStatus(src) };
	});
}

export function findExternalImages(markdown: string): string[] {
	return findImageRefs(markdown)
		.filter((ref) => ref.status === 'external')
		.map((ref) => ref.url);
}

export function imageFileKey(srcOrName: string): string {
	const url = splitImageSrc(srcOrName.trim()).url.split(/[?#]/)[0];
	const name = url.replace(/\\/g, '/').split('/').pop() ?? '';
	let decoded = name;
	try {
		decoded = decodeURIComponent(name);
	} catch {
		/* Keep malformed names matchable. */
	}
	return decoded
		.normalize('NFC')
		.toLowerCase()
		.replace(/\.[^.]+$/, '');
}

/** Map keys are exact sources, never basenames, to avoid replacing unrelated images. */
export function replaceImageSrcs(
	markdown: string,
	replacements: ReadonlyMap<string, string>,
): string {
	let result = markdown;
	for (const match of imageMatches(markdown).reverse()) {
		const src = match[2] ?? match[3];
		const replacement = replacements.get(src) ?? replacements.get(splitImageSrc(src).url);
		if (!replacement) continue;
		const prefix = match[0].indexOf('](') + 2;
		const offset = match[0].indexOf(src, prefix);
		const fragment = src.match(WIDTH_RE)?.[0] ?? '';
		const start = match.index + offset;
		result =
			result.slice(0, start) +
			splitImageSrc(replacement).url +
			fragment +
			result.slice(start + src.length);
	}
	return result;
}
