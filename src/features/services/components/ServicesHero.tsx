import Link from 'next/link';

import { KnowledgeToWorkGraphic } from './KnowledgeToWorkGraphic';
import { contactHref } from './contactHref';
import { servicesPage } from '@/content/services';

/**
 * Services hero — 60/40 editorial split on desktop.
 * Graphic sits below CTAs on mobile.
 */
export function ServicesHero() {
	return (
		<header className="shell border-b border-hairline pb-14 pt-16 md:pb-20 md:pt-20">
			<div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
				<div className="lg:col-span-7">
					<p className="editorial-label">{servicesPage.eyebrow}</p>
					<h1 className="mt-4 max-w-[20ch] font-display text-[clamp(2rem,4.2vw,3.25rem)] font-medium leading-[1.12] tracking-[-0.02em] text-ink text-balance">
						{servicesPage.title}
					</h1>
					<p className="mt-5 max-w-[38rem] text-base leading-[1.7] text-ink-secondary md:text-lg">
						{servicesPage.lead}
					</p>
					<div className="mt-8 flex flex-wrap items-center gap-4">
						<a href="#huong-lam-viec" className="editorial-button">
							{servicesPage.heroCtas.scroll}
							<span aria-hidden>↓</span>
						</a>
						<Link href={contactHref('unsure')} className="editorial-text-link">
							{servicesPage.heroCtas.contact}
							<span aria-hidden>↗</span>
						</Link>
					</div>
				</div>
				<div className="book-service-hero-graphic hidden justify-center text-ink lg:col-span-5 lg:flex lg:justify-end">
					<KnowledgeToWorkGraphic className="h-auto w-full max-w-[22rem] lg:max-w-none" />
				</div>
			</div>
		</header>
	);
}
