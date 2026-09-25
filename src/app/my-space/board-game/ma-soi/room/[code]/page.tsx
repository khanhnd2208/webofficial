import type { Metadata } from 'next';

import WerewolfRoomClient from '@/features/werewolf/components/WerewolfRoomClient';

export const metadata: Metadata = {
	title: 'Phòng Ma Sói | Board Game',
};

interface Props {
	params: Promise<{ code: string }>;
	searchParams: Promise<{ name?: string }>;
}

export default async function MaSoiRoomPage({ params, searchParams }: Props) {
	const { code } = await params;
	const { name } = await searchParams;

	return (
		<main className="min-h-screen">
			<WerewolfRoomClient code={code.toUpperCase()} initialName={name} />
		</main>
	);
}
