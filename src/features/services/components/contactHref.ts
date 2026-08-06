import { routes } from '@/config/routes';

export function contactHref(inquiryType: string) {
	return `${routes.contact}?type=${inquiryType}&sourcePage=${encodeURIComponent(routes.services)}`;
}
