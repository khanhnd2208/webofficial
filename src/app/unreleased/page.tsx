import type { Metadata } from 'next';

import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import {
	UNRELEASED_CLOSED_MESSAGE,
	UNRELEASED_IS_CLOSED,
} from '@/features/unreleased-quiz/availability';
import { UnreleasedClosedNotice } from '@/features/unreleased-quiz/components/UnreleasedClosedNotice';
import { UnreleasedQuiz } from '@/features/unreleased-quiz';

const description = UNRELEASED_IS_CLOSED
	? UNRELEASED_CLOSED_MESSAGE
	: 'Quiz 3 phút trước workshop UNRELEASED: nhìn lại những gì bạn đang có, còn thiếu và nên bắt đầu viết CV từ đâu.';

export const metadata: Metadata = {
	title: UNRELEASED_IS_CLOSED
		? 'UNRELEASED · Hẹn gặp lại'
		: 'UNRELEASED · CV của bạn đang ở bản nào?',
	description,
	robots: UNRELEASED_IS_CLOSED ? { index: false, follow: false } : undefined,
	alternates: { canonical: absoluteUrl(routes.unreleased) },
	openGraph: {
		title: UNRELEASED_IS_CLOSED ? 'UNRELEASED · Hẹn gặp lại' : 'CV của bạn đang ở bản nào?',
		description,
		url: absoluteUrl(routes.unreleased),
		type: 'website',
	},
};

export default function UnreleasedPage() {
	return UNRELEASED_IS_CLOSED ? <UnreleasedClosedNotice /> : <UnreleasedQuiz />;
}
