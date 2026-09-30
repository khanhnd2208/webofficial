import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';
import { auth } from '@/lib/auth';
import TestRoomClient from '@/features/board-game-test/TestRoomClient';

export default async function BoardGameTestPage({
	searchParams,
}: {
	searchParams: Promise<{ game?: string; code?: string }>;
}) {
	const session = await auth();
	if (!session?.user) redirect(`${routes.login}?from=${encodeURIComponent(routes.boardGameTest)}`);
	if (session.user.role !== 'admin') redirect(routes.boardGame);
	return (
		<TestRoomClient
			initialGame={(await searchParams).game}
			initialCode={(await searchParams).code}
		/>
	);
}
