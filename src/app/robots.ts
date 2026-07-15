import type { MetadataRoute } from 'next';

import { SITE_ORIGIN } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: '*',
				allow: '/',
				disallow: [
					'/admin',
					'/admin/',
					'/dang-nhap',
					'/tai-khoan',
					'/tai-khoan/',
					'/api/',
					'/m/',
					'/messages',
					'/messages/',
					'/vocabulary',
					'/vocabulary/',
					'/hoc/khoa-hoc/*/bai/',
					'/dashboard',
					'/archive',
					'/archive/',
					'/goc-cua-khanh',
					'/goc-cua-khanh/',
					'/dong-hanh',
					'/dong-hanh/',
					'/case-study',
					'/case-study/',
				],
			},
		],
		sitemap: `${SITE_ORIGIN}/sitemap.xml`,
	};
}
