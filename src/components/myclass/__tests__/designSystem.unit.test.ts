import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOTS = [
	join(process.cwd(), 'src/components/myclass'),
	join(process.cwd(), 'src/app/my-space/my-class'),
	join(process.cwd(), 'src/app/admin/my-class'),
];

const ALLOWED_ROUNDED_FULL_FILES = new Set([
	// Progress ring strokeLinecap and circular track are intentional.
	'src/components/myclass/ui/McProgressRing.tsx',
	'src/components/myclass/ui/McMeter.tsx',
	'src/components/myclass/ui/McCourseCard.tsx',
	'src/components/myclass/workspace/CourseTopBar.tsx',
]);

const ALLOWLIST_PATH_FRAGMENTS = [
	'__tests__',
	'.test.',
	'.spec.',
	'admin/studio/', // primitives define allowed patterns
	'ui/McProgressRing.tsx',
	'ui/McMeter.tsx',
	'ui/McSegmented.tsx',
	'ui/McButton.tsx',
	'ui/McBadge.tsx',
	'ui/McIcon.tsx',
	'ui/McPanel.tsx',
	'ui/McRows.tsx',
	'ui/McSection.tsx',
	'ui/McEmpty.tsx',
	'ui/McSkeleton.tsx',
	'ui/McStat.tsx',
	'ui/McSheet.tsx',
	'ui/index.ts',
	'ui/McCard.tsx',
	'ui/McProgressBar.tsx',
	'ui/McAppHeader.tsx',
	'ui/McAuthCorner.tsx',
	'workspace/CourseTopBar.tsx', // sticky product chrome may use elevation
];

function walk(dir: string, out: string[] = []): string[] {
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		const st = statSync(full);
		if (st.isDirectory()) {
			if (name === 'node_modules' || name === 'studio') continue;
			walk(full, out);
		} else if (/\.(tsx|ts|css)$/.test(name)) {
			out.push(full);
		}
	}
	return out;
}

function isAllowlisted(rel: string): boolean {
	return ALLOWLIST_PATH_FRAGMENTS.some((frag) => rel.includes(frag));
}

describe('My Class design system guard', () => {
	const files = ROOTS.flatMap((root) => walk(root)).filter((file) => {
		const rel = relative(process.cwd(), file);
		return !isAllowlisted(rel);
	});

	it('scans learner and admin My Class source files', () => {
		expect(files.length).toBeGreaterThan(10);
	});

	it('bans oversized radii outside the allowlist', () => {
		const offenders: string[] = [];
		for (const file of files) {
			const rel = relative(process.cwd(), file);
			const text = readFileSync(file, 'utf8');
			if (/rounded-(2xl|3xl)\b/.test(text)) offenders.push(`${rel}: rounded-2xl/3xl`);
			if (/rounded-full\b/.test(text) && !ALLOWED_ROUNDED_FULL_FILES.has(rel)) {
				// Allow strokeLinecap="round" and SVG circle utility classes only when not layout radius
				const withoutSvgRound = text
					.replace(/strokeLinecap="round"/g, '')
					.replace(/stroke-linecap:\s*round/g, '');
				if (/rounded-full\b/.test(withoutSvgRound)) {
					offenders.push(`${rel}: rounded-full`);
				}
			}
		}
		expect(offenders).toEqual([]);
	});

	it('bans shadows on static containers', () => {
		const offenders: string[] = [];
		for (const file of files) {
			const rel = relative(process.cwd(), file);
			const text = readFileSync(file, 'utf8');
			// Dialog/sheet/popover floating chrome may keep shadow-lg
			if (/CourseContentWorkspace\.tsx$/.test(rel) && /shadow-lg/.test(text)) continue;
			if (/shadow-\[var\(--mc-shadow/.test(text) || /shadow-(sm|md)\b/.test(text)) {
				offenders.push(rel);
			}
		}
		expect(offenders).toEqual([]);
	});

	it('bans decorative pastel washes as container backgrounds', () => {
		const offenders: string[] = [];
		const pattern = /\b(bg-accent-subtle|bg-mc-test-subtle|bg-mc-vocab-subtle)(?:\/\d+)?\b/;
		for (const file of files) {
			const rel = relative(process.cwd(), file);
			const text = readFileSync(file, 'utf8');
			// McBadge done variant is an intentional exception — skip badge-only files already allowlisted
			if (pattern.test(text)) offenders.push(rel);
		}
		expect(offenders).toEqual([]);
	});

	it('bans hardcoded hex colors outside the theme file', () => {
		const offenders: string[] = [];
		for (const file of files) {
			const rel = relative(process.cwd(), file);
			if (rel.endsWith('my-class-theme.css')) continue;
			const text = readFileSync(file, 'utf8');
			if (/#[0-9a-fA-F]{3,8}\b/.test(text)) offenders.push(rel);
		}
		expect(offenders).toEqual([]);
	});
});
