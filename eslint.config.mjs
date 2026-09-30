import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

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
	...areaBoundaries,
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
