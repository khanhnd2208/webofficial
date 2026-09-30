/**
 * Single source of truth for the app areas. See docs/areas.md.
 *
 * eslint.config.mjs reads this file for import boundaries.
 * `npm run areas:sync` writes the CI end-to-end filters from it, and
 * `npm run areas:check` (run in CI) fails when they drift, when a listed
 * path no longer exists, or when a file under src/ belongs to no area.
 *
 * Paths are repo-relative. A path without a file extension is a directory and
 * covers everything below it.
 */

/**
 * @typedef {object} Area
 * @property {string} title Name used in docs and lint messages.
 * @property {string[]} features Directories under src/features.
 * @property {string[]} components Directories under src/components.
 * @property {string[]} paths Routes, styles, content, and assets.
 * @property {string[]} e2e Specs that exercise this area. Editing one also selects the area in CI.
 */

/** @type {Record<string, Area>} */
export const AREAS = {
	boardgame: {
		title: 'Boardgame',
		features: ['board-game-shared', 'cheese-thief', 'werewolf', 'spy-fall', 'board-game-test'],
		components: [],
		paths: [
			'src/app/my-space/board-game',
			'src/app/api/cheese-thief',
			'src/app/api/ma-soi',
			'src/app/api/spy',
			'src/app/api/admin/board-game',
			'public/board-game',
		],
		e2e: ['e2e/board-game-visual.spec.ts', 'e2e/board-game-test-rooms.spec.ts'],
	},
	classroom: {
		title: 'Classroom',
		features: ['teaching', 'my-class', 'active-recall', 'myspace-tests'],
		components: [
			'teaching',
			'myclass',
			'active-recall',
			'knowledge',
			'vocab',
			'myspace/quiz',
			'myspace/tests',
		],
		paths: [
			'src/app/my-space/teaching',
			'src/app/my-space/my-class',
			'src/app/my-space/active-recall',
			'src/app/my-space/tests',
			'src/app/lop',
			'src/app/progress',
			'src/app/vocabulary',
			'src/app/api/teaching',
			'src/app/api/my-class',
			'src/app/api/myspace-tests',
			'src/app/api/vocab-sets',
			'src/app/api/admin/teaching',
			'src/app/api/admin/my-class',
			'src/app/api/admin/active-recall',
			'src/app/api/admin/myspace-tests',
			'src/app/api/admin/myspace-questions',
			'src/app/api/admin/myspace-subjects',
			'src/app/api/admin/vocab-sets',
			'src/app/admin/teaching',
			'src/app/admin/my-class',
			'src/app/admin/myspace-tests',
			'src/app/admin/tools/active-recall',
			'src/app/admin/tools/vocabulary',
			'src/app/my-class-theme.css',
			'content/active-recall',
		],
		e2e: [
			'e2e/active-recall-admin.spec.ts',
			'e2e/active-recall.spec.ts',
			'e2e/admin-workspace.spec.ts',
			'e2e/teaching-admin-workspace.spec.ts',
			'e2e/teaching-attendance-board.spec.ts',
			'e2e/teaching-learning-experience-mobile.spec.ts',
			'e2e/teaching-learning-experience-multi-device.spec.ts',
			'e2e/teaching-groups.spec.ts',
			'e2e/my-class.spec.ts',
			'e2e/my-class.admin.spec.ts',
			'e2e/myspace-tests.spec.ts',
		],
	},
	portfolio: {
		title: 'Portfolio',
		features: [
			'portfolio',
			'posts',
			'courses',
			'learn',
			'services',
			'inquiries',
			'enrollments',
			'progress',
		],
		components: ['learn', 'marketing', 'contact'],
		paths: [
			'src/app/page.tsx',
			'src/app/gioi-thieu',
			'src/app/muc-luc',
			'src/app/du-an',
			'src/app/dich-vu',
			'src/app/ghi-chep',
			'src/app/lien-he',
			'src/app/hoc',
			'src/app/chinh-sach',
			'src/app/my-space/courses',
			'src/app/tai-khoan/hoc',
			'src/app/api/learn',
			'src/app/api/learning',
			'src/app/api/inquiries',
			'src/app/api/posts',
			'src/app/api/admin/courses',
			'src/app/api/admin/posts',
			'src/app/api/admin/enrollments',
			'src/app/api/admin/inquiries',
			'src/app/api/admin/learn',
			'src/app/admin/courses',
			'src/app/admin/posts',
			'src/app/admin/enrollments',
			'src/app/admin/inquiries',
			'src/app/admin/learn-analytics',
			'src/content',
			'src/app/learn.css',
			'src/app/personal-book.css',
			'content/learn',
			'public/learn',
		],
		e2e: [
			'e2e/editorial-premium.spec.ts',
			'e2e/personal-book.spec.ts',
			'e2e/operating-focus.spec.ts',
		],
	},
	tools: {
		title: 'Tools',
		features: [],
		components: ['messages'],
		paths: [
			'src/app/messages',
			'src/app/m',
			'src/app/api/messages',
			'src/app/api/m',
			'src/app/admin/tools/messages',
			'src/app/admin/tools/lucky-card',
			'public/music',
		],
		e2e: [],
	},
};

/** Every area may import these. A change here runs every end-to-end spec. */
export const SHARED = [
	'src/lib',
	'src/config',
	'src/models',
	'src/services',
	'src/types',
	'src/utils',
	'src/test',
	'src/assets',
	'src/instrumentation.ts',
	'src/proxy.ts',
	'src/proxy.unit.test.ts',
	'src/components/ui',
	'src/components/site',
	'src/components/motion',
	'src/components/admin',
	'src/components/forms',
	'src/components/myspace/MySpaceGrid.tsx',
	// App shell, metadata, and account
	'src/app/layout.tsx',
	'src/app/globals.css',
	'src/app/error.tsx',
	'src/app/global-error.tsx',
	'src/app/not-found.tsx',
	'src/app/robots.ts',
	'src/app/sitemap.ts',
	'src/app/favicon.ico',
	'src/app/icon.png',
	'src/app/apple-icon.png',
	'src/app/dang-nhap',
	'src/app/tai-khoan/page.tsx',
	'src/app/tai-khoan/ProfileForm.tsx',
	'src/app/my-space/page.tsx',
	'src/app/my-space/error.tsx',
	// Admin shell
	'src/app/admin/layout.tsx',
	'src/app/admin/page.tsx',
	'src/app/admin/error.tsx',
	'src/app/admin/loading.tsx',
	'src/app/admin/AdminSidebar.tsx',
	'src/app/admin/AdminComingSoon.tsx',
	'src/app/admin/archive',
	'src/app/admin/media',
	'src/app/admin/settings',
	'src/app/admin/users',
	'src/app/admin/website',
	'src/app/admin/tools/layout.tsx',
	'src/app/admin/tools/page.tsx',
	// Platform APIs
	'src/app/api/auth',
	'src/app/api/health',
	'src/app/api/profile',
	'src/app/api/streak',
	'src/app/api/uploads',
	'src/app/api/admin/users',
	// Tooling
	'prisma',
	'scripts',
	'package.json',
	'package-lock.json',
	'next.config.ts',
	'playwright.config.ts',
	'vitest.config.ts',
	'tsconfig.json',
	'eslint.config.mjs',
	'.github/workflows',
	'.github/e2e-path-filters.yml',
	'.github/e2e-outside-filter.yml',
	'e2e/helpers',
	'e2e/smoke.spec.ts',
	'e2e/mobile-smoke.spec.ts',
	'e2e/public-feature-locks.spec.ts',
];

/** Changes here select no area and do not force the full end-to-end run. */
export const IGNORED = ['**/*.md', 'docs/**', '.cursor/**'];

const hasExtension = (path) => /\.[a-z0-9]+$/i.test(path.split('/').pop());

/** Filter glob for a repo path: directories cover everything below them. */
export const toGlob = (path) => (hasExtension(path) ? path : `${path}/**`);

/** Every repo path an area owns, in a stable order. */
export function areaPaths(area) {
	return [
		...area.features.map((name) => `src/features/${name}`),
		...area.components.map((name) => `src/components/${name}`),
		...area.paths,
		...area.e2e,
	];
}

/** ESLint `files` globs for an area's TypeScript sources. */
export function eslintFiles(area) {
	return areaPaths(area)
		.filter((path) => path.startsWith('src/'))
		.flatMap((path) => {
			if (!hasExtension(path)) return [`${path}/**/*.{ts,tsx}`];
			return /\.tsx?$/.test(path) ? [path] : [];
		});
}

/** `no-restricted-imports` patterns that match imports of an area's modules. */
export function importPatterns(area) {
	return areaPaths(area)
		.filter((path) => path.startsWith('src/') && !hasExtension(path))
		.flatMap((path) => {
			const alias = `@/${path.slice('src/'.length)}`;
			return [alias, `${alias}/**`];
		});
}
