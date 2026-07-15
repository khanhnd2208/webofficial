import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

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
				? 'Tài nguyên đã lưu trữ — thông tin giữ cho backlink, không còn CTA sử dụng.'
				: null;

	return (
		<main className="min-h-screen">
			<section className="border-b border-hairline">
				<div className="shell py-14 sm:py-16">
					<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">
						<Link href={routes.lab} className="hover:text-ink">
							Góc của Khánh
						</Link>
						{' / '}
						<Link href={`${routes.lab}/${category}`} className="hover:text-ink">
							{meta.title}
						</Link>
					</p>
					<div className="mt-4">
						<ResourceBadge productStatus={resource.productStatus} access={resource.access} />
					</div>
					<h1 className="mt-4 font-display type-page-title font-medium text-ink">{resource.title}</h1>
					<p className="mt-4 max-w-2xl text-lg text-ink-secondary">{resource.summary}</p>
					{warn ? (
						<p className="mt-4 max-w-2xl border-l border-vermilion pl-4 text-sm text-ink-secondary">{warn}</p>
					) : null}
				</div>
			</section>
			<section>
				<div className="shell grid max-w-3xl gap-10 py-12">
					{resource.instructions ? (
						<div>
							<SectionHeading title="Hướng dẫn" />
							<p className="mt-4 text-sm leading-relaxed text-ink-secondary">{resource.instructions}</p>
						</div>
					) : null}
					{resource.privacyNote ? (
						<div>
							<SectionHeading title="Quyền riêng tư" />
							<p className="mt-4 text-sm leading-relaxed text-ink-secondary">{resource.privacyNote}</p>
						</div>
					) : null}
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
							Cập nhật {resource.updatedAt}
						</p>
						<p className="mt-4 text-sm text-ink-secondary">
							Phản hồi:{' '}
							<Link
								href={`${routes.contact}?type=other&sourcePage=${encodeURIComponent(`${routes.lab}/${category}/${resource.slug}`)}`}
								className="text-vermilion underline"
							>
								gửi trao đổi
							</Link>
						</p>
					</div>
				</div>
			</section>
		</main>
	);
}
