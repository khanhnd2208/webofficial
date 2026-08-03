import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPolicyBySlug, getPublishedPolicies } from '@/content/policies';
import ContactLink from '@/components/contact/ContactLink';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';

type PageProps = { params: Promise<{ slug: string }> };

function formatPolicyDate(value: string): string {
	return new Date(`${value}T00:00:00+07:00`).toLocaleDateString('vi-VN', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});
}

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
		<main className="min-h-screen bg-canvas">
			<section className="border-b border-hairline">
				<div className="shell py-10 sm:py-14">
					<p className="editorial-label">Chính sách</p>
					<h1 className="type-page-title mt-4 font-display font-medium text-ink">{policy.title}</h1>
					<p className="premium-lead mt-4 max-w-xl">{policy.summary}</p>
					<p className="mt-3 text-sm text-ink-secondary">
						Cập nhật ngày {formatPolicyDate(policy.updatedAt)}
					</p>
				</div>
			</section>
			<section>
				<div className="shell max-w-2xl space-y-8 py-10 sm:py-12">
					{policy.sections.map((section) => (
						<article key={section.heading} className="border-t border-hairline pt-5">
							<h2 className="text-base font-semibold tracking-[-0.01em] text-ink">
								{section.heading}
							</h2>
							<ul className="mt-3 space-y-2.5 text-base leading-relaxed text-ink-secondary">
								{section.body.map((line) => (
									<li key={line}>{line}</li>
								))}
							</ul>
						</article>
					))}
					<p className="text-base text-ink-secondary">
						<ContactLink
							href={routes.contact}
							contactContext={{ sourcePage: `/chinh-sach/${policy.slug}` }}
							className="text-accent underline"
						>
							Gửi lời nhắn
						</ContactLink>{' '}
						nếu bạn cần xem hoặc xóa dữ liệu cá nhân.
					</p>
				</div>
			</section>
		</main>
	);
}
