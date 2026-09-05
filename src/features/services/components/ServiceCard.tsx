'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { trackEvent } from '@/lib/analytics';
import type { ServiceOffer } from '@/content/services';
import { contactHref } from './contactHref';

type ServiceCardProps = {
	offer: ServiceOffer;
	graphic: ReactNode;
	/** Horizontal layout for the supporting offer */
	variant?: 'primary' | 'supporting';
};

/**
 * Service chooser card — graphic + short copy + format chips + accordion depth.
 * Accordion uses native <details> so it works without JS.
 */
export function ServiceCard({ offer, graphic, variant = 'primary' }: ServiceCardProps) {
	const related =
		offer.inquiryType === 'training'
			? { slug: 'strategic-management-learning-experience', label: 'Strategic Management' }
			: offer.inquiryType === 'ai'
				? { slug: 'ai50-ai-cho-moi-nguoi', label: 'AI50 — AI cho mọi người' }
				: { slug: 'learning-at-moonie-cafe', label: 'Learning at Moonie Café' };
	return (
		<article id={offer.id} className={`book-service-offer book-service-${variant}`}>
			<div className="book-service-heading">
				<span className="book-chapter-number">{offer.number}</span>
				<h3>{offer.title}</h3>
				<div className="book-service-graphic" aria-hidden="true">
					{graphic}
				</div>
			</div>
			<div className="book-service-body">
				<p className="book-caption">{offer.audience}</p>
				<p className="book-lead">{offer.outcome}</p>
				<p>
					<span className="book-service-label">Nội dung có thể bắt đầu từ</span>
					{offer.topics.join(' · ')}.
				</p>
				<p>
					<span className="book-service-label">Hình thức</span>
					{offer.formats.join(' · ')}.
				</p>
				<Link href={`/du-an/${related.slug}`} className="book-service-related">
					Từ một dự án: {related.label} <span aria-hidden="true">↗</span>
				</Link>

				{offer.details.length > 0 ? (
					<details
						className="group/acc mt-6 border-t border-hairline pt-4"
						onToggle={(event) => {
							if (event.currentTarget.open) {
								trackEvent('service_detail_open', {
									label: offer.id,
									sourcePage: '/dich-vu',
								});
							}
						}}
					>
						<summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
							<span>Xem nội dung có thể triển khai</span>
							<span
								className="text-lg font-light text-accent transition-transform duration-200 group-open/acc:rotate-45"
								aria-hidden
							>
								+
							</span>
						</summary>
						<div className="mt-4 space-y-5">
							{offer.details.map((group) => (
								<div key={group.title}>
									<p className="text-sm font-semibold text-ink">{group.title}</p>
									{group.note ? (
										<p className="mt-1 text-sm text-ink-secondary">{group.note}</p>
									) : null}
									<ul className="mt-2 space-y-1">
										{group.items.map((item) => (
											<li key={item} className="text-sm leading-[1.55] text-ink-secondary">
												{item}
											</li>
										))}
									</ul>
								</div>
							))}
							{offer.principleStrip ? (
								<p className="border-t border-hairline pt-3 text-[0.8125rem] tracking-[0.04em] text-ink-secondary">
									{offer.principleStrip.join(' · ')}
								</p>
							) : null}
							{offer.deliverables ? (
								<ul className="grid gap-3 border-t border-hairline pt-4 sm:grid-cols-2">
									{offer.deliverables.map((item) => (
										<li key={item.label} className="border border-hairline bg-canvas p-3">
											<p className="text-sm font-semibold text-ink">{item.label}</p>
											<p className="mt-1 text-[0.8125rem] leading-snug text-ink-secondary">
												{item.description}
											</p>
										</li>
									))}
								</ul>
							) : null}
						</div>
					</details>
				) : null}

				<div className="mt-6 flex flex-wrap items-center gap-4">
					<Link
						href={contactHref(offer.inquiryType)}
						className="editorial-text-link"
						onClick={() =>
							trackEvent('service_cta_click', {
								type: offer.inquiryType,
								slug: offer.id,
								sourcePage: '/dich-vu',
							})
						}
					>
						{offer.cta} <span aria-hidden>→</span>
					</Link>
				</div>
			</div>
		</article>
	);
}
