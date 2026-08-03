'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';

import ContactLink from '@/components/contact/ContactLink';
import { routes } from '@/config/routes';
import { trackEvent, type AnalyticsEvent, type AnalyticsPayload } from '@/lib/analytics';

type TrackedLinkProps = ComponentProps<typeof Link> & {
	event: AnalyticsEvent;
	payload?: AnalyticsPayload;
};

export function TrackedLink({ event, payload, onClick, href, ...props }: TrackedLinkProps) {
	const hrefValue = typeof href === 'string' ? href : href.pathname || '';
	const isContact = hrefValue === routes.contact || hrefValue.startsWith(`${routes.contact}?`);
	const handleClick: NonNullable<ComponentProps<typeof Link>['onClick']> = (clickEvent) => {
		onClick?.(clickEvent);
		if (!clickEvent.defaultPrevented) trackEvent(event, payload);
	};

	if (isContact) {
		return <ContactLink {...props} href={hrefValue} onClick={handleClick} />;
	}

	return <Link {...props} href={href} onClick={handleClick} />;
}
