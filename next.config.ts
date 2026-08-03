import type { NextConfig } from "next";

import { PUBLIC_REDIRECTS } from "./src/config/routes";

const nextConfig: NextConfig = {
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

      // Explorer Teacher — retired marketing URLs
      ...PUBLIC_REDIRECTS,
    ];
  },
};

export default nextConfig;
