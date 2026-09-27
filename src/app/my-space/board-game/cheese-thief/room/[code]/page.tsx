import type { Metadata } from 'next';

import CheeseThiefRoomClient from '@/features/cheese-thief/components/CheeseThiefRoomClient';

export const metadata: Metadata = {
	title: 'Phòng Cheese Thief | Board Game',
};

interface Props {
	params: Promise<{ code: string }>;
	searchParams: Promise<{ name?: string }>;
}

export default async function CheeseThiefRoomPage({ params, searchParams }: Props) {
	const { code } = await params;
	const { name } = await searchParams;

	return (
		<main className="min-h-screen">
			<CheeseThiefRoomClient code={code.toUpperCase()} initialName={name} />
		</main>
	);
}
