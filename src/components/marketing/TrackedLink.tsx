'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';

import { trackEvent, type AnalyticsEvent, type AnalyticsPayload } from '@/lib/analytics';

type TrackedLinkProps = ComponentProps<typeof Link> & {
	event: AnalyticsEvent;
	payload?: AnalyticsPayload;
};

export function TrackedLink({ event, payload, onClick, href, ...props }: TrackedLinkProps) {
	const handleClick: NonNullable<ComponentProps<typeof Link>['onClick']> = (clickEvent) => {
		onClick?.(clickEvent);
		if (!clickEvent.defaultPrevented) trackEvent(event, payload);
	};

	return <Link {...props} href={href} onClick={handleClick} />;
}
