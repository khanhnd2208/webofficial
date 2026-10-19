import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';
import { GiftThankYou } from '@/features/unreleased-gift/components/GiftThankYou';
import { hasFeedback } from '@/features/unreleased-gift/services/feedbackService';
import { giftPdfIsReady } from '@/features/unreleased-gift/services/giftFile';

export const metadata: Metadata = {
	title: 'Cảm ơn bạn · UNRELEASED',
	robots: { index: false, follow: false },
};

export default async function UnreleasedGiftThanksPage({
	searchParams,
}: {
	searchParams: Promise<{ response?: string }>;
}) {
	const { response } = await searchParams;
	if (!response || !/^[0-9a-f-]{36}$/i.test(response) || !(await hasFeedback(response))) {
		redirect(routes.unreleasedGift);
	}
	return <GiftThankYou responseId={response} pdfReady={giftPdfIsReady()} />;
}
