import type { Metadata } from 'next';

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
		<main
			className="flex min-h-svh flex-col items-center justify-center bg-canvas px-8 py-16"
			data-testid="gate-home"
		>
			<p className="gate-item-enter mb-10 font-mono text-[0.6875rem] tracking-[0.2em] text-ink/40 uppercase">
				Mục lục
			</p>
			<GateNav />
		</main>
	);
}
