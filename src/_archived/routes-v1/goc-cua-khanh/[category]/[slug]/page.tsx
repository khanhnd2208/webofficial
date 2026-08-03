import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import ContactLink from '@/components/contact/ContactLink';
import { ResourceBadge, SectionHeading } from '@/components/marketing';
import { getPublishedResources, getResourceBySlug } from '@/content';
import { LAB_CATEGORY_META, labCategoryForResource } from '@/content/lab';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';

type PageProps = { params: Promise<{ category: string; slug: string }> };

export function generateStaticParams() {
	return getPublishedResources().map((r) => ({
		category: labCategoryForResource(r.type),
		slug: r.slug,
	}));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { category, slug } = await params;
	const resource = getResourceBySlug(slug);
	if (!resource) return { title: 'Không tìm thấy' };
	return {
		title: resource.title,
		description: resource.summary,
		alternates: { canonical: absoluteUrl(`${routes.lab}/${category}/${slug}`) },
		robots: { index: false, follow: false },
	};
}

export default async function LabResourcePage({ params }: PageProps) {
	const { category, slug } = await params;
	const meta = LAB_CATEGORY_META[category];
	const resource = getResourceBySlug(slug);
	if (!meta || !resource) notFound();

	const warn =
		resource.productStatus === 'prototype' || resource.productStatus === 'beta'
			? 'Đây là bản thử nghiệm — có thể đổi hoặc dừng bất kỳ lúc nào.'
			: resource.productStatus === 'archived'
				? 'Tài nguyên đã được lưu trữ. Trang này vẫn được giữ để các liên kết cũ không bị gián đoạn, nhưng không còn nút sử dụng.'
				: null;

	return (
		<main className="min-h-screen bg-canvas">
			<section className="border-b border-hairline bg-section-tint px-5 py-16 sm:px-8 sm:py-24">
				<div className="shell">
					<p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-secondary">
						<Link href={routes.archive} className="hover:text-ink">
							Dự án
						</Link>
						{' / '}
						<Link href={`${routes.lab}/${category}`} className="hover:text-ink">
							{meta.title}
						</Link>
					</p>
					<div className="mt-10 grid items-center gap-12 lg:grid-cols-12 lg:gap-20">
						<div className="lg:col-span-7">
							<ResourceBadge productStatus={resource.productStatus} access={resource.access} />
							<h1 className="mt-5 max-w-3xl text-balance font-display text-[clamp(3rem,6vw,5.75rem)] font-normal leading-[0.96] tracking-[-0.04em] text-ink">{resource.title}</h1>
							<p className="mt-7 max-w-2xl text-base font-light leading-[1.8] text-ink-secondary sm:text-lg">{resource.summary}</p>
							{warn ? <p className="mt-6 max-w-2xl border-l border-accent pl-4 text-sm leading-relaxed text-ink-secondary">{warn}</p> : null}
						</div>
						<div className="overflow-hidden bg-paper lg:col-span-5">
							<img src="/brand/hero-journey.jpg" alt="" className="aspect-[4/3] w-full object-cover grayscale-[25%]" />
						</div>
					</div>
				</div>
			</section>
			<section>
				<div className="shell grid max-w-4xl gap-16 py-16 sm:py-24">
					{resource.instructions ? (
						<div>
							<SectionHeading title="Hướng dẫn" />
							<p className="mt-4 text-sm leading-relaxed text-ink-secondary">
								{resource.instructions}
							</p>
						</div>
					) : null}
					{resource.privacyNote ? (
						<div>
							<SectionHeading title="Quyền riêng tư" />
							<p className="mt-4 text-sm leading-relaxed text-ink-secondary">
								{resource.privacyNote}
							</p>
						</div>
					) : null}
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
							Cập nhật {resource.updatedAt}
						</p>
						<p className="mt-4 text-sm text-ink-secondary">
							Bạn muốn góp ý về tài nguyên này?{' '}
							<ContactLink
								href={`${routes.contact}?type=other&sourcePage=${encodeURIComponent(`${routes.lab}/${category}/${resource.slug}`)}`}
								className="text-vermilion underline"
							>
								Gửi tôi vài dòng
							</ContactLink>
						</p>
					</div>
				</div>
			</section>
		</main>
	);
}
