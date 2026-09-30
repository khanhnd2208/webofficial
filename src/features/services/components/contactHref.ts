import { routes } from '@/config/routes';

export function contactHref(inquiryType: string, sourcePage: string = routes.about) {
	return `${routes.contact}?type=${encodeURIComponent(inquiryType)}&sourcePage=${encodeURIComponent(sourcePage)}`;
}
