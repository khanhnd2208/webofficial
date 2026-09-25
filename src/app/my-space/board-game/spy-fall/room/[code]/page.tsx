import type { Metadata } from 'next';

import SpyGameClient from '@/features/spy-fall/components/spy/SpyGameClient';

export const metadata: Metadata = {
	title: 'Phòng Spy Fall | Board Game',
};

interface Props {
	params: Promise<{ code: string }>;
	searchParams: Promise<{ name?: string }>;
}

export default async function SpyFallRoomPage({ params, searchParams }: Props) {
	const { code } = await params;
	const { name } = await searchParams;

	return (
		<main className="min-h-screen">
			<SpyGameClient code={code.toUpperCase()} initialName={name} />
		</main>
	);
}
