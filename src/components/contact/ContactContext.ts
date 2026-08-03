import { routes } from '@/config/routes';
import { INQUIRY_TYPES, type InquiryType } from '@/features/inquiries/constants';

export const CONTACT_CAMPAIGN_KEYS = [
	'utm_source',
	'utm_medium',
	'utm_campaign',
	'utm_content',
	'utm_term',
	'ref',
	'gclid',
	'fbclid',
] as const;

export type ContactCampaignKey = (typeof CONTACT_CAMPAIGN_KEYS)[number];
export type ContactCampaignParams = Partial<Record<ContactCampaignKey, string>>;

/** Attribution attached to a contact submission, independent of how the form opens. */
export type ContactContext = {
	inquiryType: InquiryType;
	sourcePage: string;
	sourceCourseSlug?: string;
	campaignParams?: ContactCampaignParams;
};

export type ContactContextInput = Partial<ContactContext>;

export function normalizeInquiryType(raw: string | null | undefined): InquiryType {
	if (!raw || !(INQUIRY_TYPES as readonly string[]).includes(raw)) return 'unsure';

	return raw as InquiryType;
}

function clean(value: string | null | undefined): string | undefined {
	const trimmed = value?.trim();
	return trimmed || undefined;
}

export function campaignParamsFromSearchParams(
	searchParams: Pick<URLSearchParams, 'get'>,
): ContactCampaignParams | undefined {
	const values: ContactCampaignParams = {};
	for (const key of CONTACT_CAMPAIGN_KEYS) {
		const value = clean(searchParams.get(key));
		if (value) values[key] = value;
	}
	return Object.keys(values).length > 0 ? values : undefined;
}

export function contactContextFromSearchParams(
	searchParams: Pick<URLSearchParams, 'get'>,
	fallbackSourcePage: string = routes.contact,
): ContactContext {
	return {
		inquiryType: normalizeInquiryType(searchParams.get('type')),
		sourcePage: clean(searchParams.get('sourcePage')) || fallbackSourcePage,
		sourceCourseSlug:
			clean(searchParams.get('course')) || clean(searchParams.get('sourceCourseSlug')),
		campaignParams: campaignParamsFromSearchParams(searchParams),
	};
}

export function mergeContactContext(
	base: ContactContext,
	override?: ContactContextInput,
): ContactContext {
	const campaignParams = {
		...(base.campaignParams ?? {}),
		...(override?.campaignParams ?? {}),
	};

	return {
		inquiryType: normalizeInquiryType(override?.inquiryType ?? base.inquiryType),
		sourcePage: clean(override?.sourcePage) || base.sourcePage,
		sourceCourseSlug: clean(override?.sourceCourseSlug) || base.sourceCourseSlug,
		campaignParams: Object.keys(campaignParams).length > 0 ? campaignParams : undefined,
	};
}

/** Builds a real fallback URL so contact links still retain attribution without JavaScript. */
export function buildContactHref(href: string, context?: ContactContextInput): string {
	if (!context) return href;

	const [pathAndQuery, hash] = href.split('#', 2);
	const [path, query] = pathAndQuery.split('?', 2);
	const params = new URLSearchParams(query || '');

	if (context.inquiryType) params.set('type', normalizeInquiryType(context.inquiryType));
	if (clean(context.sourcePage)) params.set('sourcePage', context.sourcePage!.trim());
	if (clean(context.sourceCourseSlug)) params.set('course', context.sourceCourseSlug!.trim());
	for (const [key, value] of Object.entries(context.campaignParams ?? {})) {
		if (clean(value)) params.set(key, value.trim());
	}

	const serialized = params.toString();
	return `${path}${serialized ? `?${serialized}` : ''}${hash ? `#${hash}` : ''}`;
}
