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
					'/ghi-chep',
					'/ghi-chep/',
					'/my-space/tests',
					'/my-space/tests/',
					'/my-space/my-class',
					'/my-space/my-class/',
					'/vocabulary',
					'/vocabulary/',
					'/hoc/khoa-hoc/*/bai/',
					'/dashboard',
					'/archive',
					'/archive/',
					'/bai-viet',
					'/bai-viet/',
					'/phat-trien-ban-than',
					'/phat-trien-ban-than/',
					'/goc-cua-khanh',
					'/goc-cua-khanh/',
					'/dong-hanh',
					'/dong-hanh/',
					'/case-study',
					'/case-study/',
					'/giang-day',
					'/dong-hanh',
					'/dong-hanh/',
				],
			},
		],
		sitemap: `${SITE_ORIGIN}/sitemap.xml`,
	};
}
