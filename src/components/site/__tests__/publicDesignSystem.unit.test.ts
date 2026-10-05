import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Public surfaces that should share one type scale, radius, shadow and motion.
 * My Class, admin, lesson readers and in-room game UI stay out of this pass.
 */
const ROOTS = [
	'src/app/muc-luc',
	'src/app/page.tsx',
	'src/app/personal-book.css',
	'src/app/gioi-thieu',
	'src/app/trai-nghiem',
	'src/app/du-an',
	'src/app/dich-vu',
	'src/app/lien-he',
	'src/app/dang-nhap',
	'src/app/tai-khoan',
	'src/app/chinh-sach',
	'src/app/not-found.tsx',
	'src/app/my-space/page.tsx',
	'src/app/my-space/board-game/page.tsx',
	'src/components/site/IntroLanding.tsx',
	'src/components/site/NotFoundPanel.tsx',
	'src/components/site/RecentClasses.tsx',
	'src/components/site/SiteAuthChip.tsx',
	'src/components/site/SiteHeader.tsx',
	'src/components/site/PublicMinimalChrome.tsx',
	'src/components/site/SiteTopBar.tsx',
	'src/components/site/MainContent.tsx',
	'src/components/contact',
];

/**
 * Still off the scale, with why. Empty once each surface has moved.
 * Google's sign-in mark keeps its brand colors in CSS, not in these files.
 */
const ALLOWLIST: Record<string, string> = {
	'src/components/site/PublicMinimalChrome.tsx': 'Replaced by the shared header',
};

function walk(path: string, out: string[] = []): string[] {
	if (!existsSync(path)) return out;
	const st = statSync(path);
	if (st.isDirectory()) {
		for (const name of readdirSync(path)) {
			if (name === 'node_modules' || name.startsWith('.')) continue;
			walk(join(path, name), out);
		}
	} else if (/\.(tsx|css)$/.test(path) && !/\.(test|spec)\./.test(path)) {
		out.push(path);
	}
	return out;
}

function fontSizeUnder12(css: string): string[] {
	const hits: string[] = [];
	const re = /font-size:\s*([^;!}]+)/g;
	let match: RegExpExecArray | null;
	while ((match = re.exec(css))) {
		const raw = match[1].trim();
		const px = raw.match(/^(\d+(?:\.\d+)?)px$/);
		if (px && Number(px[1]) < 12) hits.push(raw);
		const rem = raw.match(/^(\d+(?:\.\d+)?)rem$/);
		if (rem && Number(rem[1]) * 16 < 11.99) hits.push(raw);
	}
	return hits;
}

function violations(rel: string, text: string): string[] {
	const found: string[] = [];
	if (/text-\[[^\]]*(?:px|rem)[^\]]*\]/.test(text)) found.push('text-[…]');
	if (rel.endsWith('.css')) {
		const small = fontSizeUnder12(text);
		if (small.length) found.push(`font-size < 12px (${small.join(', ')})`);
	}
	if (/rounded-\[[^\]]+\]/.test(text)) found.push('rounded-[…]');
	if (/rounded-(2xl|3xl)\b/.test(text)) found.push('rounded-2xl/3xl');
	if (/shadow-\[[^\]]+\]/.test(text)) found.push('shadow-[…]');
	if (rel.endsWith('.tsx') && /#[0-9a-fA-F]{3,8}\b/.test(text)) found.push('hex');
	if (/\bfont-mono\b/.test(text)) found.push('font-mono');
	if (/duration-\d+/.test(text)) found.push('duration-<ms>');
	return found;
}

describe('public design system guard', () => {
	const files = ROOTS.flatMap((root) => walk(join(process.cwd(), root)));

	it('scans the public surfaces', () => {
		expect(files.length).toBeGreaterThan(8);
	});

	it('keeps type, radius, shadow, color and motion on the shared scale', () => {
		const offenders: string[] = [];
		for (const file of files) {
			const rel = relative(process.cwd(), file);
			if (ALLOWLIST[rel]) continue;
			const found = violations(rel, readFileSync(file, 'utf8'));
			if (found.length) offenders.push(`${rel}: ${found.join(', ')}`);
		}
		expect(offenders).toEqual([]);
	});

	it('only allowlists files that still exist', () => {
		const missing = Object.keys(ALLOWLIST).filter((rel) => !existsSync(join(process.cwd(), rel)));
		expect(missing).toEqual([]);
	});
});
