import Script from 'next/script';

/**
 * Umami loader — only renders when public env is configured.
 */
export default function AnalyticsScript() {
	const src = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;
	const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
	if (!src || !websiteId) return null;

	return <Script async defer src={src} data-website-id={websiteId} strategy="afterInteractive" />;
}
