import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getPolicyBySlug, getPublishedPolicies } from '@/content/policies';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
	return getPublishedPolicies().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const policy = getPolicyBySlug(slug);
	if (!policy) return { title: 'Không tìm thấy' };
	return {
		title: policy.title,
		description: policy.summary,
		alternates: { canonical: absoluteUrl(`/chinh-sach/${policy.slug}`) },
	};
}

export default async function PolicyPage({ params }: PageProps) {
	const { slug } = await params;
	const policy = getPolicyBySlug(slug);
	if (!policy) notFound();

	return (
		<main className="min-h-screen">
			<section className="border-b border-hairline">
				<div className="shell py-14 sm:py-16">
					<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">Chính sách</p>
					<h1 className="mt-3 font-display type-page-title font-medium text-ink">{policy.title}</h1>
					<p className="mt-4 max-w-2xl text-base text-ink-secondary">{policy.summary}</p>
					<p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
						Cập nhật {policy.updatedAt}
						{policy.legalReview === 'pending' ? ' · Đang chờ rà soát pháp lý' : ''}
					</p>
				</div>
			</section>
			<section>
				<div className="shell max-w-3xl space-y-10 py-12 sm:py-14">
					{policy.sections.map((section) => (
						<article key={section.heading} className="border-t border-hairline pt-6">
							<h2 className="font-display text-xl font-medium text-ink">{section.heading}</h2>
							<ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-secondary">
								{section.body.map((line) => (
									<li key={line}>{line}</li>
								))}
							</ul>
						</article>
					))}
					<p className="text-sm text-ink-secondary">
						<Link href={routes.contact} className="text-vermilion underline">
							Liên hệ
						</Link>{' '}
						nếu bạn cần xem hoặc xóa dữ liệu cá nhân.
					</p>
				</div>
			</section>
		</main>
	);
}
