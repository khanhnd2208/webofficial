import type { Metadata } from 'next';

import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { UnreleasedGiftForm } from '@/features/unreleased-gift/components/UnreleasedGiftForm';
import {
	UNRELEASED_CLOSED_MESSAGE,
	UNRELEASED_IS_CLOSED,
} from '@/features/unreleased-quiz/availability';
import { UnreleasedClosedNotice } from '@/features/unreleased-quiz/components/UnreleasedClosedNotice';

const description = UNRELEASED_IS_CLOSED
	? UNRELEASED_CLOSED_MESSAGE
	: 'Chia sẻ cảm nhận sau workshop UNRELEASED và nhận tài liệu của buổi học.';

export const metadata: Metadata = {
	title: UNRELEASED_IS_CLOSED ? 'UNRELEASED · Hẹn gặp lại' : 'UNRELEASED · Cảm nhận sau workshop',
	description,
	robots: UNRELEASED_IS_CLOSED ? { index: false, follow: false } : undefined,
	alternates: { canonical: absoluteUrl(routes.unreleasedGift) },
	openGraph: {
		title: UNRELEASED_IS_CLOSED ? 'UNRELEASED · Hẹn gặp lại' : 'UNRELEASED · Cảm nhận sau workshop',
		description,
		url: absoluteUrl(routes.unreleasedGift),
		type: 'website',
	},
};

export default function UnreleasedGiftPage() {
	return UNRELEASED_IS_CLOSED ? <UnreleasedClosedNotice /> : <UnreleasedGiftForm />;
}
