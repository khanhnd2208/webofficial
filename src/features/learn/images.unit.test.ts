import { describe, expect, it } from 'vitest';
import {
	findImageRefs,
	findExternalImages,
	imageSrcStatus,
	imageFileKey,
	replaceImageSrcs,
} from './images';

describe('lesson image sources', () => {
	it('distinguishes local, own-host, external and unresolved sources', () => {
		for (const src of ['/uploads/a.webp', '/learn/a.png', 'https://www.toiladuykhanh.com/a#w=50'])
			expect(imageSrcStatus(src)).toBe('ready');
		for (const src of ['https://googleusercontent.com/a', '//evil.test/a'])
			expect(imageSrcStatus(src)).toBe('external');
		for (const src of ['', 'hinh-1.png', 'file:///a.png', 'blob:abc', 'data:image/png;base64,abc'])
			expect(imageSrcStatus(src)).toBe('missing');
	});
	it('ignores fenced and inline code and escaped image examples', () => {
		const md =
			'![x](hinh-1.png "Caption")\n```md\n![code](bad.png)\n```\n`![inline](bad.png)`\n\\![escaped](bad.png)\n![outside](https://elsewhere.test/a)';
		expect(findImageRefs(md).map((ref) => ref.src)).toEqual([
			'hinh-1.png',
			'https://elsewhere.test/a',
		]);
		expect(findExternalImages(md)).toEqual(['https://elsewhere.test/a']);
	});
	it('matches basenames independent of case, directories, extension and encoding', () => {
		expect(imageFileKey('folder/HINH-1.png#w=75')).toBe(imageFileKey('hinh-1.jpg'));
		expect(imageFileKey('folder/h%C3%ACnh.png')).toBe('hình');
	});
	it('preserves alt, titles, widths and code during replacements', () => {
		const md = '![alt](hinh-1.png#w=50 "Caption")\n![two](<hinh-1.png>#bad)\n`![x](hinh-1.png)`';
		expect(replaceImageSrcs(md, new Map([['hinh-1.png', '/uploads/new.webp']]))).toBe(
			'![alt](/uploads/new.webp#w=50 "Caption")\n![two](<hinh-1.png>#bad)\n`![x](hinh-1.png)`',
		);
		expect(
			replaceImageSrcs(
				'![a](<folder/a (1).png> "t")',
				new Map([['folder/a (1).png', '/uploads/a.webp']]),
			),
		).toBe('![a](</uploads/a.webp> "t")');
	});
	it('recognizes an empty destination', () => {
		expect(findImageRefs('![]()')[0].status).toBe('missing');
	});
});
