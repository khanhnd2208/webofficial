import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'next/server': path.resolve(__dirname, './node_modules/next/server.js'),
		},
	},
	test: {
		globals: true,
		setupFiles: ['./src/test/setup.ts'],
		exclude: ['node_modules', '.next', 'e2e/**'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'text-summary', 'lcov'],
			include: ['src/**/*.{ts,tsx}'],
			exclude: [
				'src/**/*.test.{ts,tsx}',
				'src/**/*.spec.{ts,tsx}',
				'src/test/**',
				'src/_archived/**',
				'src/app/**/page.tsx',
				'src/app/**/layout.tsx',
			],
			thresholds: {
				lines: 15,
				functions: 10,
				branches: 10,
				statements: 15,
			},
		},
		projects: [
			{
				extends: true,
				test: {
					name: 'unit',
					environment: 'node',
					include: [
						'src/**/*.unit.test.ts',
						'src/lib/__tests__/**/*.test.ts',
						'src/utils/**/*.test.ts',
					],
					exclude: [
						'src/_archived/**',
						'src/**/*.integration.test.ts',
						'src/**/*.test.tsx',
						'src/services/__tests__/**',
						'src/app/api/**/__tests__/**',
					],
				},
			},
			{
				extends: true,
				test: {
					name: 'integration',
					environment: 'node',
					fileParallelism: false,
					include: [
						'src/**/*.integration.test.ts',
						'src/services/__tests__/**/*.test.ts',
					],
					exclude: ['src/_archived/**'],
					setupFiles: ['./src/test/setup.ts', './src/test/setup.integration.ts'],
					testTimeout: 30_000,
				},
			},
			{
				extends: true,
				test: {
					name: 'component',
					environment: 'jsdom',
					include: ['src/**/*.test.tsx'],
					exclude: ['src/_archived/**'],
					setupFiles: ['./src/test/setup.ts', './src/test/setup.component.ts'],
				},
			},
		],
	},
});
