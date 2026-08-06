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
	const isSupporting = variant === 'supporting';

	return (
		<article
			id={offer.id}
			className={`group h-full scroll-mt-24 border border-hairline bg-paper/40 transition-colors duration-300 hover:border-ink/25 ${
				isSupporting ? 'md:grid md:grid-cols-12 md:gap-8' : 'flex flex-col'
			}`}
		>
			<div
				className={`flex items-center justify-center border-hairline bg-canvas/60 p-6 text-ink ${
					isSupporting
						? 'border-b md:col-span-4 md:border-r md:border-b-0'
						: 'min-h-56 border-b md:min-h-80'
				}`}
			>
				<div className="w-full max-w-[18rem] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02] [&_svg]:h-auto [&_svg]:w-full">
					{graphic}
				</div>
			</div>

			<div className={`flex flex-1 flex-col p-6 md:p-8 ${isSupporting ? 'md:col-span-8' : ''}`}>
				<p className="font-mono text-[0.6875rem] tracking-[0.16em] text-ink/45">
					{offer.number}
				</p>
				<h3 className="mt-2 font-display text-[clamp(1.25rem,2vw,1.625rem)] font-medium tracking-[-0.02em] text-ink">
					{offer.title}
				</h3>
				<p className="mt-3 text-sm leading-[1.65] text-ink-secondary">{offer.audience}</p>
				<p className="mt-3 text-sm leading-[1.65] text-ink">{offer.outcome}</p>

				{offer.topics.length > 0 ? (
					<div className="mt-5">
						<p className="text-[0.6875rem] font-semibold tracking-[0.06em] text-ink/50 uppercase">
							Có thể tập trung vào
						</p>
						<ul className="mt-2 flex flex-wrap gap-2">
							{offer.topics.map((topic) => (
								<li
									key={topic}
									className="border border-hairline bg-canvas px-2.5 py-1 text-xs text-ink"
								>
									{topic}
								</li>
							))}
						</ul>
					</div>
				) : null}

				<div className="mt-4">
					<p className="text-[0.6875rem] font-semibold tracking-[0.06em] text-ink/50 uppercase">
						Hình thức
					</p>
					<ul className="mt-2 flex flex-wrap gap-2">
						{offer.formats.map((format) => (
							<li
								key={format}
								className="rounded-full border border-ink/15 px-2.5 py-1 text-xs text-ink-secondary"
							>
								{format}
							</li>
						))}
					</ul>
				</div>

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
						<summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
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
											<li
												key={item}
												className="text-sm leading-[1.55] text-ink-secondary"
											>
												{item}
											</li>
										))}
									</ul>
								</div>
							))}
							{offer.principleStrip ? (
								<p className="border-t border-hairline pt-3 text-xs tracking-[0.04em] text-ink/55">
									{offer.principleStrip.join(' · ')}
								</p>
							) : null}
							{offer.deliverables ? (
								<ul className="grid gap-3 border-t border-hairline pt-4 sm:grid-cols-2">
									{offer.deliverables.map((item) => (
										<li key={item.label} className="border border-hairline bg-canvas p-3">
											<p className="text-sm font-semibold text-ink">{item.label}</p>
											<p className="mt-1 text-xs leading-snug text-ink-secondary">
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
