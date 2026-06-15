import type { Metadata } from 'next';

import PublicMessageView from './PublicMessageView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Lời nhắn | HANOICAM',
	robots: { index: false, follow: false },
};

export default async function PublicMessagePage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	return <PublicMessageView slug={slug} />;
}
