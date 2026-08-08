/**
 * Umami analytics helper — no-op when env is missing.
 * Never send PII, inquiry text, or personal learning data.
 */

export const ANALYTICS_EVENTS = [
	'service_view',
	'service_cta_click',
	'contact_form_start',
	'contact_form_submit',
	'resource_open',
	'resource_download',
	'article_complete',
	'case_study_view',
	'case_artifact_engage',
	'course_interest',
	'login_start',
	'home_hero_manifesto_click',
	'home_featured_article_click',
	'home_learning_experience_click',
	'home_project_click',
	'home_closing_connect_click',
	'home_primary_cta_click',
	'home_secondary_cta_click',
	'service_select',
	'service_detail_open',
	'project_filter_select',
	'contact_form_error',
	'contact_form_success',
	'contact_open',
	'home_need_select',
	'service_proof_click',
	'myspace_test_start',
	'myspace_test_complete',
	'myspace_test_restart',
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export type AnalyticsPayload = {
	slug?: string;
	type?: string;
	sourcePage?: string;
	label?: string;
};

declare global {
	interface Window {
		umami?: {
			track: (event: string, data?: Record<string, string>) => void;
		};
	}
}

export function isAnalyticsEvent(value: string): value is AnalyticsEvent {
	return (ANALYTICS_EVENTS as readonly string[]).includes(value);
}

export function trackEvent(event: AnalyticsEvent, payload: AnalyticsPayload = {}): void {
	if (typeof window === 'undefined') return;
	if (!isAnalyticsEvent(event)) return;

	const data: Record<string, string> = {};
	if (payload.slug) data.slug = payload.slug;
	if (payload.type) data.type = payload.type;
	if (payload.sourcePage) data.sourcePage = payload.sourcePage;
	if (payload.label) data.label = payload.label;

	try {
		window.umami?.track(event, Object.keys(data).length ? data : undefined);
	} catch {
		// analytics must never break UX
	}
}
