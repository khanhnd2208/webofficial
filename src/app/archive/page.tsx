import type { Metadata } from 'next';
import Link from 'next/link';

import { archiveContent } from '@/content/about';
import { getPublishedResources } from '@/content/resources';
import { labCategoryForResource } from '@/content/lab';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';

export const metadata: Metadata = {
	title: archiveContent.title,
	description: archiveContent.intro,
	alternates: { canonical: absoluteUrl(routes.archive) },
	robots: { index: false, follow: false },
};

export default function ArchivePage() {
	const resources = getPublishedResources();

	return (
		<main className="min-h-screen">
			<section className="section-space border-b border-hairline">
				<div className="shell max-w-2xl">
					<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">Tiện ích</p>
					<h1 className="mt-3 font-display type-page-title font-medium text-ink">{archiveContent.title}</h1>
					<p className="mt-5 text-base leading-relaxed text-ink-secondary">{archiveContent.intro}</p>
				</div>
			</section>

			<section className="section-space border-b border-hairline">
				<div className="shell">
					<h2 className="font-display text-xl font-medium text-ink">Bề mặt đã chuyển hướng</h2>
					<ul className="mt-6 space-y-4">
						<li className="border-t border-hairline pt-4 text-sm text-ink-secondary">
							<span className="font-semibold text-ink">Đồng hành / dịch vụ cũ</span> →{' '}
							<Link href={routes.aboutServices} className="text-accent hover:underline">
								Tôi & Dịch vụ
							</Link>
						</li>
						<li className="border-t border-hairline pt-4 text-sm text-ink-secondary">
							<span className="font-semibold text-ink">Case study</span> →{' '}
							<Link href={routes.aboutMilestones} className="text-accent hover:underline">
								Dấu mốc
							</Link>
						</li>
						<li className="border-t border-hairline pt-4 text-sm text-ink-secondary">
							<span className="font-semibold text-ink">Học viên</span> vẫn dùng{' '}
							<Link href={routes.accountLearning} className="text-accent hover:underline">
								{routes.accountLearning}
							</Link>
						</li>
					</ul>
				</div>
			</section>

			{resources.length > 0 ? (
				<section className="section-space">
					<div className="shell">
						<h2 className="font-display text-xl font-medium text-ink">Tài nguyên lab (noindex)</h2>
						<p className="mt-2 max-w-2xl text-sm text-ink-secondary">
							Các mục dưới đây vẫn mở được trực tiếp; hub Góc của Khánh đã chuyển về Archive.
						</p>
						<ul className="mt-8 space-y-4">
							{resources.map((r) => (
								<li key={r.slug} className="border-t border-hairline pt-4">
									<Link
										href={`${routes.lab}/${labCategoryForResource(r.type)}/${r.slug}`}
										className="font-display text-lg text-ink hover:text-accent"
									>
										{r.title}
									</Link>
									<p className="mt-1 text-sm text-ink-secondary">{r.summary}</p>
								</li>
							))}
						</ul>
					</div>
				</section>
			) : (
				<section className="section-space">
					<div className="shell max-w-2xl">
						<p className="text-sm text-ink-secondary">
							Chưa có tài nguyên lab công khai. Khi có, chúng sẽ xuất hiện tại đây với noindex.
						</p>
					</div>
				</section>
			)}
		</main>
	);
}
