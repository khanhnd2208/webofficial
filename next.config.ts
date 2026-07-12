import type { NextConfig } from "next";

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
      { source: '/blog', destination: '/bai-viet', permanent: true },
      { source: '/blog/:path*', destination: '/bai-viet/:path*', permanent: true },

      // Auth & account renames
      { source: '/login', destination: '/dang-nhap', permanent: true },
      { source: '/dashboard', destination: '/hoc', permanent: true },
      { source: '/profile', destination: '/tai-khoan', permanent: true },

      // Admin vocabulary alias
      { source: '/admin/vocabulary', destination: '/admin/tools/vocabulary', permanent: true },
    ];
  },
};

export default nextConfig;
