import 'server-only';

import { isPrivacyPolicyPublished } from '@/content/policies';
import { AppError } from '@/lib/appError';
import { getInquiryEmailConfig } from '@/lib/inquiryEmail';
import { getRateLimitSecret } from '@/lib/inquiryRateLimit';

export interface InquiryAvailability {
	enabled: boolean;
	disabledReason?: string;
	privacyPublished: boolean;
	emailConfigured: boolean;
	rateLimitConfigured: boolean;
}

/**
 * Shared server-side readiness check for both the contact page and dialog.
 * Development may persist an inquiry without outbound email; production fails
 * closed unless privacy, delivery, and abuse-protection configuration are ready.
 */
export function getInquiryAvailability(): InquiryAvailability {
	const privacyPublished = isPrivacyPolicyPublished();
	const emailConfigured = getInquiryEmailConfig() !== null;
	const rateLimitConfigured = getRateLimitSecret() !== null;
	const production = process.env.NODE_ENV === 'production';

	let disabledReason: string | undefined;
	if (!privacyPublished) {
		disabledReason = 'Chính sách bảo mật chưa sẵn sàng.';
	} else if (production && !emailConfigured) {
		disabledReason = 'Kênh nhận lời nhắn chưa được cấu hình đầy đủ trên máy chủ.';
	} else if (production && !rateLimitConfigured) {
		disabledReason = 'Kênh nhận lời nhắn đang tạm khóa vì cấu hình bảo vệ chưa đầy đủ.';
	}

	return {
		enabled: disabledReason === undefined,
		disabledReason,
		privacyPublished,
		emailConfigured,
		rateLimitConfigured,
	};
}

export function assertInquiryAvailable(): void {
	const availability = getInquiryAvailability();
	if (!availability.enabled) {
		throw new AppError(
			availability.disabledReason ?? 'Kênh nhận lời nhắn đang tạm khóa.',
			503,
			'INQUIRY_UNAVAILABLE',
		);
	}
}
