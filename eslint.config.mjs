import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import designPlugin from './scripts/design-lint.mjs';

import { AREAS, eslintFiles, importPatterns } from './scripts/areas/areas.mjs';

const motionImportRestriction = {
	paths: [
		{
			name: 'framer-motion',
			importNames: ['motion'],
			message: 'Use `m` from framer-motion inside LazyMotion strict (see MotionProvider).',
		},
	],
};

/**
 * One block per area: its files may import shared code and their own area,
 * never another area. The area map lives in scripts/areas/areas.mjs.
 */
const areaBoundaries = Object.entries(AREAS).map(([name, area]) => {
	const others = Object.entries(AREAS).filter(([otherName]) => otherName !== name);
	return {
		files: eslintFiles(area),
		rules: {
			'no-restricted-imports': [
				'error',
				{
					...motionImportRestriction,
					patterns: [
						{
							group: others.flatMap(([, other]) => importPatterns(other)),
							message: `${area.title} cannot import ${others
								.map(([, other]) => other.title)
								.join(', ')}. See docs/areas.md.`,
						},
					],
				},
			],
		},
	};
});

/**
 * File size budget. New source files stay under MAX_LINES (blank lines and
 * comments not counted); split a file instead of growing it past the limit.
 * Files that were already larger are capped at their size on 2026-09-30, so
 * they can shrink but not grow. Lower a cap when you split a file, and delete
 * the entry once it fits under MAX_LINES. See docs/03-CODING_STANDARDS.md.
 */
const MAX_LINES = 800;
const OVERSIZED_FILE_CAPS = {
	'src/app/admin/tools/lucky-card/page.tsx': 1683,
	'src/app/vocabulary/store/StoreClient.tsx': 1627,
	'src/components/myclass/admin/CourseContentWorkspace.tsx': 1562,
	'src/components/myclass/workspace/CourseOutline.tsx': 1079,
	'src/app/vocabulary/[id]/mcq/page.tsx': 1055,
	'src/components/myclass/CourseWorkspace.tsx': 985,
	'src/app/vocabulary/[id]/fill-blank/page.tsx': 931,
	'src/features/board-game-test/service.ts': 927,
	'src/features/myspace-tests/repositories/myspaceTestsRepository.ts': 918,
	'src/features/my-class/services/assessmentService.ts': 903,
	'src/components/teaching/groups/GroupListWorkspace.tsx': 893,
	'src/features/spy-fall/services/spyGameService.ts': 857,
	'src/components/forms/TiptapEditor.tsx': 854,
	'src/components/active-recall/ActiveRecallEditor.tsx': 837,
};
/** Data tables, not logic. */
const SIZE_EXEMPT_FILES = ['src/features/spy-fall/lib/spy/wordBank.ts'];

const maxLines = (max) => ['error', { max, skipBlankLines: true, skipComments: true }];
// Bracket paths such as [id] are glob classes; escape them to match literally.
const literalGlob = (path) => path.replace(/[[\]]/g, '\\$&');

const fileSizeBudget = [
	{
		files: ['src/**/*.{ts,tsx}'],
		ignores: [
			'src/**/*.test.{ts,tsx}',
			...SIZE_EXEMPT_FILES,
			...Object.keys(OVERSIZED_FILE_CAPS).map(literalGlob),
		],
		rules: { 'max-lines': maxLines(MAX_LINES) },
	},
	...Object.entries(OVERSIZED_FILE_CAPS).map(([path, cap]) => ({
		files: [literalGlob(path)],
		rules: { 'max-lines': maxLines(cap) },
	})),
];

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	{
		rules: {
			'@next/next/no-img-element': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
			'no-restricted-imports': ['error', motionImportRestriction],
		},
	},
	{
		files: [
			'src/app/admin/**/*.{ts,tsx}',
			'src/components/admin/**/*.{ts,tsx}',
			'src/components/teaching/admin/**/*.{ts,tsx}',
			'src/components/myclass/admin/**/*.{ts,tsx}',
			'src/components/active-recall/ActiveRecallEditor.tsx',
			'src/components/messages/MusicTrackSelect.tsx',
		],
		rules: {
			'no-restricted-globals': [
				'error',
				{
					name: 'confirm',
					message: 'Use useAdminConfirm / AdminConfirmDialog instead of window.confirm.',
				},
			],
			'no-restricted-syntax': [
				'error',
				{
					selector: "CallExpression[callee.object.name='window'][callee.property.name='confirm']",
					message: 'Use useAdminConfirm / AdminConfirmDialog instead of window.confirm.',
				},
			],
		},
	},
	{
		files: ['src/**/*.tsx'],
		ignores: ['src/**/*.test.tsx'],
		plugins: { design: designPlugin },
		rules: { 'design/design-values': 'error' },
	},
	...areaBoundaries,
	...fileSizeBudget,
	{
		// Next's CommonJS ESLint plugin loads this adapter with require().
		files: ['scripts/vendor/next-eslint-glob/*.cjs'],
		rules: { '@typescript-eslint/no-require-imports': 'off' },
	},
	// Override default ignores of eslint-config-next.
	globalIgnores([
		// Default ignores of eslint-config-next:
		'.next/**',
		'out/**',
		'build/**',
		'next-env.d.ts',
		'coverage/**',
		'.tmp-*/**',
		'.cursor/**',
		// CommonJS PM2 config — require() is intentional
		'ecosystem.config.js',
	]),
]);

export default eslintConfig;
