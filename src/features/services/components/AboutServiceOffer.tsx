'use client';

import Link from 'next/link';
import { routes } from '@/config/routes';
import { aboutCollaboration } from '@/content/about';
import { servicesFaq, type ServiceOffer } from '@/content/services';
import { trackEvent } from '@/lib/analytics';
import { contactHref } from './contactHref';

type AboutServiceOfferProps = {
	offer: ServiceOffer;
	title: string;
	description: string;
	sourcePage?: string;
};

/** Native disclosure keeps the experience archive short and works without JavaScript. */
export function AboutServiceOffer({
	offer,
	title,
	description,
	sourcePage = routes.about,
}: AboutServiceOfferProps) {
	return (
		<article id={offer.id} className="about-offer" aria-labelledby={`${offer.id}-title`}>
			<span className="book-caption about-offer-number" aria-hidden="true">
				{offer.number}
			</span>
			<div>
				<h3 id={`${offer.id}-title`}>{title}</h3>
				<p className="about-offer-description">{description}</p>
				<details
					className="about-offer-details"
					onToggle={(event) => {
						if (event.currentTarget.open)
							trackEvent('service_detail_open', { label: offer.id, sourcePage });
					}}
				>
					<summary aria-label={`${aboutCollaboration.disclosure}: ${title}`}>
						<span>{aboutCollaboration.disclosure}</span>
						<span className="about-disclosure-mark" aria-hidden="true">
							+
						</span>
					</summary>
					<div className="about-offer-expanded">
						<p className="about-offer-audience">{offer.audience}</p>
						<p>
							<strong>Hình thức</strong> · {offer.formats.join(' · ')}
						</p>
						<div className="about-offer-topics">
							{offer.details.map((group) => (
								<div key={group.title}>
									<h4>{group.title}</h4>
									{group.note ? <p>{group.note}</p> : null}
									<ul>
										{group.items.map((item) => (
											<li key={item}>{item}</li>
										))}
									</ul>
								</div>
							))}
						</div>
						{offer.principleStrip ? (
							<p className="about-offer-note">{offer.principleStrip.join(' · ')}</p>
						) : null}
						{offer.deliverables ? (
							<dl className="about-offer-deliverables">
								{offer.deliverables.map((item) => (
									<div key={item.label}>
										<dt>{item.label}</dt>
										<dd>{item.description}</dd>
									</div>
								))}
							</dl>
						) : null}
						{offer.inquiryType === 'ai' ? (
							<p className="about-offer-note">{servicesFaq[2].answer}</p>
						) : null}
						<Link
							href={contactHref(offer.inquiryType, sourcePage)}
							className="book-link"
							onClick={() =>
								trackEvent('service_cta_click', {
									type: offer.inquiryType,
									slug: offer.id,
									sourcePage,
								})
							}
						>
							{offer.cta} <span aria-hidden="true">→</span>
						</Link>
					</div>
				</details>
			</div>
		</article>
	);
}
