import Script from 'next/script';

import { SITE_ORIGIN } from '@/config/site';

/**
 * Umami loader — only renders when public env is configured.
 * `data-domains` keeps the tracker silent on any other host, so a production
 * build exercised on localhost (CI end-to-end tests) records no page views.
 */
export default function AnalyticsScript() {
	const src = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;
	const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
	if (!src || !websiteId) return null;

	const host = new URL(SITE_ORIGIN).hostname;
	const domains = host.startsWith('www.') ? host : `${host},www.${host}`;

	return (
		<Script
			async
			defer
			src={src}
			data-website-id={websiteId}
			data-domains={domains}
			strategy="afterInteractive"
		/>
	);
}
