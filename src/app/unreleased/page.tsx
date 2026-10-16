import type { Metadata } from 'next';

import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { UnreleasedQuiz } from '@/features/unreleased-quiz';

const description =
	'Quiz 3 phút trước workshop UNRELEASED: nhìn lại những gì bạn đang có, còn thiếu và nên bắt đầu viết CV từ đâu.';

export const metadata: Metadata = {
	title: 'UNRELEASED · CV của bạn đang ở bản nào?',
	description,
	alternates: { canonical: absoluteUrl(routes.unreleased) },
	openGraph: {
		title: 'CV của bạn đang ở bản nào?',
		description,
		url: absoluteUrl(routes.unreleased),
		type: 'website',
	},
};

export default function UnreleasedPage() {
	return <UnreleasedQuiz />;
}
