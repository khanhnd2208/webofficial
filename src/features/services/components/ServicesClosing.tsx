import Link from 'next/link';

import { servicesClosing } from '@/content/services';
import { contactHref } from './contactHref';

/**
 * Closing invitation — short, calm, one CTA.
 */
export function ServicesClosing() {
	return (
		<section className="shell py-14 md:py-20" aria-labelledby="closing-title">
			<div className="mx-auto max-w-[var(--measure)]">
				<h2
					id="closing-title"
					className="font-display text-[clamp(1.75rem,3vw,2.25rem)] font-medium tracking-[-0.02em] text-ink"
				>
					{servicesClosing.title}
				</h2>
				<p className="mt-5 text-base leading-[1.7] text-ink-secondary">{servicesClosing.lead}</p>
				<p className="mt-4 text-base leading-[1.7] text-ink-secondary">{servicesClosing.after}</p>
				<Link href={contactHref('unsure')} className="editorial-button mt-8 w-full sm:w-auto">
					{servicesClosing.cta}
					<span aria-hidden>→</span>
				</Link>
			</div>
		</section>
	);
}
