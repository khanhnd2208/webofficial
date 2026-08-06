import type { Metadata } from 'next';

import SpyGameClient from '@/components/spy/SpyGameClient';

export const metadata: Metadata = {
	title: 'Phòng chơi | AI Là Gián Điệp',
};

interface Props {
	params: Promise<{ code: string }>;
	searchParams: Promise<{ name?: string }>;
}

export default async function SpyRoomPage({ params, searchParams }: Props) {
	const { code } = await params;
	const { name } = await searchParams;

	return (
		<main className="min-h-screen">
			<SpyGameClient code={code.toUpperCase()} initialName={name} />
		</main>
	);
}
