import type { Metadata } from 'next';
import Link from 'next/link';

import GateNav from '@/components/site/GateNav';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';

export const metadata: Metadata = {
	title: 'Mục lục',
	description: 'Chọn hướng đi: Giới thiệu, Dự án, Dịch vụ, và My Space.',
	alternates: { canonical: absoluteUrl(routes.toc) },
};

/**
 * Mục lục — destination gate formerly at `/`.
 * Entered from the intro cover via "Mở mục lục".
 */
export default function TocPage() {
	return (
		<main className="personal-book book-toc-page" data-testid="gate-home">
			<h1 className="book-caption book-toc-label">Mục lục</h1>
			<GateNav />
			<div className="book-page-end">
				<Link href={routes.contact}>Gửi lời nhắn ↗</Link>
			</div>
		</main>
	);
}
