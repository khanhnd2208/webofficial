import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

import { MC_ICON_NAMES, isMcIconName } from './McIcon';

const SRC_ROOT = join(process.cwd(), 'src');
const SKIP_DIR_NAMES = new Set(['_archived', 'node_modules']);
const ICON_TAG = /<McIcon\b([^>]*?)\/?>/g;
const NAME_ATTR = /\bname=(?:"([a-z_]+)"|'([a-z_]+)'|\{([^}]+)\})/g;

function walk(dir: string, out: string[] = []): string[] {
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		const st = statSync(full);
		if (st.isDirectory()) {
			if (SKIP_DIR_NAMES.has(name)) continue;
			walk(full, out);
		} else if (/\.(tsx|ts)$/.test(name) && !name.endsWith('.d.ts')) {
			out.push(full);
		}
	}
	return out;
}

function iconNamesFromTag(attrs: string): string[] {
	const names: string[] = [];
	for (const match of attrs.matchAll(NAME_ATTR)) {
		const literal = match[1] ?? match[2];
		if (literal) {
			names.push(literal);
			continue;
		}
		const cleaned = (match[3] ?? '').replace(/(===|!==|==)\s*['"][^'"]+['"]/g, '');
		for (const quoted of cleaned.matchAll(/['"]([a-z_]+)['"]/g)) {
			names.push(quoted[1]);
		}
	}
	return names;
}

describe('McIcon catalog', () => {
	it('includes the teaching glyphs that previously fell back to a question mark', () => {
		expect(MC_ICON_NAMES).toEqual(
			expect.arrayContaining(['calendar_month', 'check_circle', 'lock_open', 'verified']),
		);
		for (const name of ['calendar_month', 'check_circle', 'lock_open', 'verified']) {
			expect(isMcIconName(name)).toBe(true);
		}
	});

	it('does not leave unknown McIcon names or Material Symbols ligatures in product source', () => {
		const unknown = new Set<string>();
		const ligatures: string[] = [];
		for (const file of walk(SRC_ROOT)) {
			const rel = relative(process.cwd(), file);
			if (rel.endsWith('McIcon.tsx') || rel.endsWith('McIcon.unit.test.ts')) continue;
			const text = readFileSync(file, 'utf8');
			if (text.includes('material-symbols-outlined')) ligatures.push(rel);
			if (!text.includes('<McIcon')) continue;
			for (const tag of text.matchAll(ICON_TAG)) {
				for (const name of iconNamesFromTag(tag[1])) {
					if (!isMcIconName(name)) unknown.add(`${rel}:${name}`);
				}
			}
		}
		expect([...unknown].sort()).toEqual([]);
		expect(ligatures).toEqual([]);
	});
});
