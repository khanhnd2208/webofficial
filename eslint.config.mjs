import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const motionImportRestriction = {
	paths: [
		{
			name: 'framer-motion',
			importNames: ['motion'],
			message: 'Use `m` from framer-motion inside LazyMotion strict (see MotionProvider).',
		},
	],
};

function areaImportPatterns(features, components) {
	return [
		...features.flatMap((name) => [`@/features/${name}`, `@/features/${name}/**`]),
		...components.flatMap((name) => [`@/components/${name}`, `@/components/${name}/**`]),
	];
}

const classroomImports = areaImportPatterns(
	['teaching', 'my-class', 'active-recall', 'myspace-tests'],
	['teaching', 'myclass', 'active-recall', 'knowledge'],
);
const portfolioImports = areaImportPatterns(
	['portfolio', 'posts', 'courses', 'learn', 'services', 'inquiries', 'enrollments', 'progress'],
	['learn', 'marketing', 'contact'],
);
const boardgameImports = areaImportPatterns(
	['board-game-shared', 'cheese-thief', 'werewolf', 'spy-fall', 'board-game-test'],
	[],
);

function areaBoundary(files, message, patterns) {
	return {
		files,
		rules: {
			'no-restricted-imports': [
				'error',
				{
					...motionImportRestriction,
					patterns: [{ group: patterns, message }],
				},
			],
		},
	};
}

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
			'src/components/MusicTrackSelect.tsx',
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
	areaBoundary(
		[
			'src/features/board-game-shared/**/*.{ts,tsx}',
			'src/features/cheese-thief/**/*.{ts,tsx}',
			'src/features/werewolf/**/*.{ts,tsx}',
			'src/features/spy-fall/**/*.{ts,tsx}',
			'src/features/board-game-test/**/*.{ts,tsx}',
			'src/app/my-space/board-game/**/*.{ts,tsx}',
			'src/app/api/cheese-thief/**/*.{ts,tsx}',
			'src/app/api/ma-soi/**/*.{ts,tsx}',
			'src/app/api/spy/**/*.{ts,tsx}',
			'src/app/api/admin/board-game/**/*.{ts,tsx}',
		],
		'Boardgame cannot import the classroom or portfolio areas. See docs/areas.md.',
		[...classroomImports, ...portfolioImports],
	),
	areaBoundary(
		[
			'src/features/teaching/**/*.{ts,tsx}',
			'src/features/my-class/**/*.{ts,tsx}',
			'src/features/active-recall/**/*.{ts,tsx}',
			'src/features/myspace-tests/**/*.{ts,tsx}',
			'src/app/my-space/teaching/**/*.{ts,tsx}',
			'src/app/my-space/my-class/**/*.{ts,tsx}',
			'src/app/my-space/active-recall/**/*.{ts,tsx}',
			'src/app/my-space/tests/**/*.{ts,tsx}',
			'src/app/lop/**/*.{ts,tsx}',
			'src/app/api/teaching/**/*.{ts,tsx}',
			'src/app/api/my-class/**/*.{ts,tsx}',
			'src/app/api/myspace-tests/**/*.{ts,tsx}',
			'src/app/api/admin/teaching/**/*.{ts,tsx}',
			'src/app/api/admin/my-class/**/*.{ts,tsx}',
			'src/app/api/admin/active-recall/**/*.{ts,tsx}',
			'src/app/api/admin/myspace-tests/**/*.{ts,tsx}',
			'src/app/api/admin/myspace-questions/**/*.{ts,tsx}',
			'src/app/api/admin/myspace-subjects/**/*.{ts,tsx}',
			'src/app/admin/teaching/**/*.{ts,tsx}',
			'src/app/admin/my-class/**/*.{ts,tsx}',
			'src/app/admin/active-recall/**/*.{ts,tsx}',
			'src/app/admin/myspace-tests/**/*.{ts,tsx}',
			'src/components/teaching/**/*.{ts,tsx}',
			'src/components/myclass/**/*.{ts,tsx}',
			'src/components/active-recall/**/*.{ts,tsx}',
			'src/components/knowledge/**/*.{ts,tsx}',
		],
		'Classroom cannot import the boardgame or portfolio areas. See docs/areas.md.',
		[...boardgameImports, ...portfolioImports],
	),
	areaBoundary(
		[
			'src/features/portfolio/**/*.{ts,tsx}',
			'src/features/posts/**/*.{ts,tsx}',
			'src/features/courses/**/*.{ts,tsx}',
			'src/features/learn/**/*.{ts,tsx}',
			'src/features/services/**/*.{ts,tsx}',
			'src/features/inquiries/**/*.{ts,tsx}',
			'src/features/enrollments/**/*.{ts,tsx}',
			'src/features/progress/**/*.{ts,tsx}',
			'src/app/page.tsx',
			'src/app/gioi-thieu/**/*.{ts,tsx}',
			'src/app/muc-luc/**/*.{ts,tsx}',
			'src/app/du-an/**/*.{ts,tsx}',
			'src/app/dich-vu/**/*.{ts,tsx}',
			'src/app/ghi-chep/**/*.{ts,tsx}',
			'src/app/lien-he/**/*.{ts,tsx}',
			'src/app/hoc/**/*.{ts,tsx}',
			'src/app/chinh-sach/**/*.{ts,tsx}',
			'src/app/my-space/courses/**/*.{ts,tsx}',
			'src/app/tai-khoan/hoc/**/*.{ts,tsx}',
			'src/app/api/learn/**/*.{ts,tsx}',
			'src/app/api/learning/**/*.{ts,tsx}',
			'src/app/api/inquiries/**/*.{ts,tsx}',
			'src/app/api/posts/**/*.{ts,tsx}',
			'src/app/api/admin/courses/**/*.{ts,tsx}',
			'src/app/api/admin/posts/**/*.{ts,tsx}',
			'src/app/api/admin/enrollments/**/*.{ts,tsx}',
			'src/app/api/admin/inquiries/**/*.{ts,tsx}',
			'src/app/api/admin/learn/**/*.{ts,tsx}',
			'src/app/admin/courses/**/*.{ts,tsx}',
			'src/app/admin/posts/**/*.{ts,tsx}',
			'src/app/admin/enrollments/**/*.{ts,tsx}',
			'src/app/admin/inquiries/**/*.{ts,tsx}',
			'src/app/admin/learn/**/*.{ts,tsx}',
			'src/app/admin/learn-analytics/**/*.{ts,tsx}',
			'src/components/learn/**/*.{ts,tsx}',
			'src/components/marketing/**/*.{ts,tsx}',
			'src/components/contact/**/*.{ts,tsx}',
		],
		'Portfolio cannot import the boardgame or classroom areas. See docs/areas.md.',
		[...boardgameImports, ...classroomImports],
	),
	{
		// Archived research code is not under LazyMotion site shell
		files: ['src/_archived/**'],
		rules: {
			'no-restricted-imports': 'off',
		},
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
		// Archived snapshots — not shipped; keep lint focused on live app
		'src/_archived/**',
	]),
]);

export default eslintConfig;
