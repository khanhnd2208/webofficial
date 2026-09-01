import type { NextConfig } from 'next';

import { buildContentSecurityPolicy } from './src/config/contentSecurityPolicy';
import { PUBLIC_REDIRECTS } from './src/config/routes';

const nextConfig: NextConfig = {
	poweredByHeader: false,
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
	serverExternalPackages: ['@prisma/client', '.prisma/client', '@prisma/adapter-pg', 'pg'],
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
	async redirects() {
		return [
			// Blog → Bài viết (permanent, SEO)
			{ source: '/blog', destination: '/', permanent: true },
			{ source: '/blog/:path*', destination: '/', permanent: true },

			// Auth & account renames
			{ source: '/login', destination: '/dang-nhap', permanent: true },
			{ source: '/profile', destination: '/tai-khoan', permanent: true },

			// Learning account alias
			{ source: '/dashboard', destination: '/tai-khoan/hoc', permanent: true },

			// Admin vocabulary alias
			{ source: '/admin/vocabulary', destination: '/admin/tools/vocabulary', permanent: true },

			// Temporary admin workspace consolidations (non-permanent until stable)
			{ source: '/my-space/teaching', destination: '/admin/teaching', permanent: false },
			{ source: '/my-space/teaching/:path*', destination: '/admin/teaching/:path*', permanent: false },
			{ source: '/messages', destination: '/admin/tools/messages', permanent: false },
			{ source: '/messages/:path*', destination: '/admin/tools/messages/:path*', permanent: false },

			// Explorer Teacher — retired marketing URLs
			...PUBLIC_REDIRECTS,
		];
	},
};

export default nextConfig;
