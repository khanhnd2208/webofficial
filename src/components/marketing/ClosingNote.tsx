import type { ReactNode } from 'react';

import { TrackedLink } from './TrackedLink';
import type { AnalyticsEvent, AnalyticsPayload } from '@/lib/analytics';

type ClosingNoteCta = {
	href: string;
	label: string;
	event: AnalyticsEvent;
	payload?: AnalyticsPayload;
};

type ClosingNoteProps = {
	eyebrow?: string;
	title: string;
	body?: string;
	primaryCta: ClosingNoteCta;
	secondaryCta?: ClosingNoteCta;
	children?: ReactNode;
};

export function ClosingNote({
	eyebrow = 'Tiếp theo',
	title,
	body,
	primaryCta,
	secondaryCta,
	children,
}: ClosingNoteProps) {
	return (
		<section className="editorial-section bg-ink text-center text-canvas">
			<div className="shell mx-auto max-w-3xl">
				<p className="editorial-label !text-sunlight">{eyebrow}</p>
				<h2 className="editorial-heading mx-auto mt-5 max-w-3xl text-balance text-canvas">{title}</h2>
				{body ? (
					<p className="mx-auto mt-6 max-w-xl text-base leading-[1.7] text-canvas/70">{body}</p>
				) : null}
				{children}
				<div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
					<TrackedLink
						href={primaryCta.href}
						event={primaryCta.event}
						payload={primaryCta.payload}
						className="editorial-button border-canvas bg-canvas text-ink"
					>
						{primaryCta.label} <span aria-hidden>→</span>
					</TrackedLink>
					{secondaryCta ? (
						<TrackedLink
							href={secondaryCta.href}
							event={secondaryCta.event}
							payload={secondaryCta.payload}
							className="editorial-button border-canvas/40 bg-transparent text-canvas"
						>
							{secondaryCta.label} <span aria-hidden>→</span>
						</TrackedLink>
					) : null}
				</div>
			</div>
		</section>
	);
}
