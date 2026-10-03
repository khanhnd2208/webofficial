import type { NextConfig } from 'next';

import { buildContentSecurityPolicy } from './src/config/contentSecurityPolicy';
import { LEARN_COURSE_ALIASES, PUBLIC_REDIRECTS } from './src/config/routes';

const nextConfig: NextConfig = {
	poweredByHeader: false,
	// The deploy script provides a unique value per release. Next.js uses this
	// identifier to protect clients with stale Server Action references during
	// rolling or symlink-based deployments.
	deploymentId: process.env.NEXT_DEPLOYMENT_ID || undefined,
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'X-Frame-Options', value: 'SAMEORIGIN' },
					{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
					{
						key: 'Permissions-Policy',
						value: 'camera=(), microphone=(), geolocation=(), payment=()',
					},
					{
						key: 'Content-Security-Policy',
						value: buildContentSecurityPolicy(process.env.NODE_ENV),
					},
				],
			},
		];
	},
	// Keep the generated Prisma client on the Node side. Turbopack bundling it
	// can freeze a client from before `prisma generate`, so new models such as
	// myClassVocabAssignment appear as undefined at runtime.
	serverExternalPackages: [
		'@prisma/client',
		'.prisma/client',
		'@prisma/adapter-pg',
		'pg',
		// DOMPurify's server DOM reads jsdom resources from its installed package.
		'isomorphic-dompurify',
	],
	turbopack: {
		root: process.cwd(),
	},
	// Hide Next.js “N” floating indicator during local QA (dev-only; never ships to production).
	// Source: Next.js DevTools / route indicator — not an app control.
	devIndicators: false,
	images: {
		formats: ['image/avif', 'image/webp'],
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'lh3.googleusercontent.com',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: '*.googleusercontent.com',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'toiladuykhanh.com',
				pathname: '/uploads/**',
			},
			{
				protocol: 'https',
				hostname: 'www.toiladuykhanh.com',
				pathname: '/uploads/**',
			},
		],
	},
	async rewrites() {
		return [...LEARN_COURSE_ALIASES];
	},
	async redirects() {
		return [
			// Blog is retired; old links land on Mục lục.
			{ source: '/blog', destination: '/muc-luc', permanent: true },
			{ source: '/blog/:path*', destination: '/muc-luc', permanent: true },

			// Auth & account renames
			{ source: '/login', destination: '/dang-nhap', permanent: true },
			{ source: '/profile', destination: '/tai-khoan', permanent: true },

			// Learning account alias
			{ source: '/dashboard', destination: '/tai-khoan/hoc', permanent: true },

			// Admin vocabulary alias
			{ source: '/admin/vocabulary', destination: '/admin/tools/vocabulary', permanent: true },

			// Teaching now lives in My Space. Keep old bookmarks working without
			// rendering the Admin shell before the compatibility redirect completes.
			{
				source: '/admin/teaching/:classId/attendance-board',
				destination: '/my-space/teaching/:classId?tab=share',
				permanent: false,
			},
			{
				source: '/admin/teaching/:classId/gradebook',
				destination: '/my-space/teaching/:classId?tab=attendance',
				permanent: false,
			},
			{
				source: '/admin/teaching/:classId/roster',
				destination: '/my-space/teaching/:classId?tab=students',
				permanent: false,
			},
			{
				source: '/admin/teaching/:classId/sessions',
				destination: '/my-space/teaching/:classId?tab=setup',
				permanent: false,
			},
			{
				source: '/admin/teaching/:classId/settings',
				destination: '/my-space/teaching/:classId?tab=setup',
				permanent: false,
			},
			{
				source: '/admin/teaching/:classId/public',
				destination: '/my-space/teaching/:classId?tab=setup',
				permanent: false,
			},
			{ source: '/admin/teaching/new', destination: '/my-space/teaching/new', permanent: false },
			{
				source: '/admin/teaching/import',
				destination: '/my-space/teaching/import',
				permanent: false,
			},
			{
				source: '/admin/teaching/:classId',
				destination: '/my-space/teaching/:classId',
				permanent: false,
			},
			{ source: '/admin/teaching', destination: '/my-space/teaching', permanent: false },

			// Temporary admin workspace consolidations (non-permanent until stable)
			{ source: '/messages', destination: '/admin/tools/messages', permanent: false },
			{ source: '/messages/:path*', destination: '/admin/tools/messages/:path*', permanent: false },

			// Explorer Teacher — retired marketing URLs
			...PUBLIC_REDIRECTS,
		];
	},
};

export default nextConfig;
