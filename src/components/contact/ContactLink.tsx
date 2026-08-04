'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useSyncExternalStore, type ComponentProps } from 'react';

import { routes } from '@/config/routes';
import {
	buildContactHref,
	campaignParamsFromSearchParams,
	type ContactContextInput,
} from './ContactContext';

type ContactLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
	href?: string;
	contactContext?: ContactContextInput;
};

function subscribeToLocation(onStoreChange: () => void): () => void {
	window.addEventListener('popstate', onStoreChange);
	return () => window.removeEventListener('popstate', onStoreChange);
}

function getClientLocation(): string {
	return window.location.href;
}

function getServerLocation(): string {
	return '';
}

/** Attribution-preserving link to /lien-he — single contact flow, no modal. */
export default function ContactLink({
	href = routes.contact,
	contactContext,
	...props
}: ContactLinkProps) {
	const pathname = usePathname();
	const currentLocation = useSyncExternalStore(
		subscribeToLocation,
		getClientLocation,
		getServerLocation,
	);
	const resolvedHref = useMemo(() => {
		const origin = currentLocation ? new URL(currentLocation).origin : 'https://contact.local';
		const enriched = new URL(buildContactHref(href, contactContext), origin);
		if (!enriched.searchParams.has('sourcePage')) {
			enriched.searchParams.set('sourcePage', pathname || routes.contact);
		}
		if (currentLocation) {
			const currentUrl = new URL(currentLocation);
			for (const [key, value] of Object.entries(
				campaignParamsFromSearchParams(currentUrl.searchParams) ?? {},
			)) {
				if (!enriched.searchParams.has(key)) enriched.searchParams.set(key, value);
			}
		}
		return `${enriched.pathname}${enriched.search}${enriched.hash}`;
	}, [contactContext, currentLocation, href, pathname]);

	return <Link {...props} href={resolvedHref} />;
}
