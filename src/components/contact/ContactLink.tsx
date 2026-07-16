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
import { useContactDialog } from './ContactDialogProvider';

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

/** A real link for fallback/new-tab behavior that opens the global form on a plain click. */
export default function ContactLink({
	href = routes.contact,
	contactContext,
	onClick,
	target,
	...props
}: ContactLinkProps) {
	const controller = useContactDialog();
	const pathname = usePathname();
	const currentLocation = useSyncExternalStore(
		subscribeToLocation,
		getClientLocation,
		getServerLocation,
	);
	const fallbackHref = useMemo(() => {
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

	return (
		<Link
			{...props}
			href={fallbackHref}
			target={target}
			onClick={(event) => {
				onClick?.(event);
				if (
					event.defaultPrevented ||
					!controller ||
					event.button !== 0 ||
					event.metaKey ||
					event.ctrlKey ||
					event.shiftKey ||
					event.altKey ||
					Boolean(target && target !== '_self') ||
					event.currentTarget.hasAttribute('download')
				) {
					return;
				}

				event.preventDefault();
				controller.openContact(contactContext, fallbackHref);
			}}
		/>
	);
}
