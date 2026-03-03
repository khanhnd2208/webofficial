import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

export default {
	content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				// Neutral palette - elegant and minimal
				neutral: {
					50: '#fafafa',
					100: '#f5f5f5',
					200: '#e5e5e5',
					300: '#d4d4d4',
					400: '#a3a3a3',
					500: '#737373',
					600: '#525252',
					700: '#404040',
					800: '#262626',
					900: '#171717',
					950: '#0a0a0a',
				},
				// Accent colors - refined and professional
				primary: {
					50: '#f0f9ff',
					100: '#e0f2fe',
					200: '#bae6fd',
					300: '#7dd3fc',
					400: '#38bdf8',
					500: '#0ea5e9',
					600: '#0284c7',
					700: '#0369a1',
					800: '#075985',
					900: '#0c4a6e',
				},
			},
			fontFamily: {
				// Fonts are primarily defined via @theme inline in globals.css
				// These are kept as fallback stacks
				sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
				serif: ['var(--font-merriweather)', 'Georgia', 'serif'],
				mono: ['SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
			},
			typography: ({ theme }: { theme: (path: string) => string }) => ({
				DEFAULT: {
					css: {
						'--tw-prose-body': theme('colors.neutral[700]'),
						'--tw-prose-headings': theme('colors.neutral[900]'),
						'--tw-prose-links': theme('colors.primary[600]'),
						'--tw-prose-bold': theme('colors.neutral[900]'),
						'--tw-prose-code': theme('colors.neutral[900]'),
						'--tw-prose-pre-bg': theme('colors.neutral[50]'),
						'--tw-prose-quotes': theme('colors.neutral[700]'),
						'--tw-prose-invert-body': theme('colors.neutral[300]'),
						'--tw-prose-invert-headings': theme('colors.white'),
						'--tw-prose-invert-links': theme('colors.primary[400]'),
						'--tw-prose-invert-bold': theme('colors.white'),
						'--tw-prose-invert-code': theme('colors.white'),
						'--tw-prose-invert-pre-bg': theme('colors.neutral[900]'),
						'--tw-prose-invert-quotes': theme('colors.neutral[300]'),
						maxWidth: 'none',
					},
				},
			}),
		},
	},
	plugins: [typography],
} satisfies Config;
