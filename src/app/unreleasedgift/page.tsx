import type { Metadata } from 'next';

import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { UnreleasedGiftForm } from '@/features/unreleased-gift/components/UnreleasedGiftForm';

const description = 'Chia sẻ cảm nhận sau workshop UNRELEASED và nhận tài liệu của buổi học.';

export const metadata: Metadata = {
	title: 'UNRELEASED · Cảm nhận sau workshop',
	description,
	alternates: { canonical: absoluteUrl(routes.unreleasedGift) },
	openGraph: {
		title: 'UNRELEASED · Cảm nhận sau workshop',
		description,
		url: absoluteUrl(routes.unreleasedGift),
		type: 'website',
	},
};

export default function UnreleasedGiftPage() {
	return <UnreleasedGiftForm />;
}
