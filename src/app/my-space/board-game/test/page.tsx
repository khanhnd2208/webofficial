import { redirect } from 'next/navigation';

import { AdminForbidden } from '@/components/admin/AdminForbidden';
import { routes } from '@/config/routes';
import { auth } from '@/lib/auth';
import TestRoomClient from '@/features/board-game-test/TestRoomClient';

export default async function BoardGameTestPage({
	searchParams,
}: {
	searchParams: Promise<{ game?: string; code?: string }>;
}) {
	const [session, { game, code }] = await Promise.all([auth(), searchParams]);
	const query = new URLSearchParams();
	if (game) query.set('game', game);
	if (code) query.set('code', code);
	const here = query.size ? `${routes.boardGameTest}?${query}` : routes.boardGameTest;
	if (!session?.user) redirect(`${routes.login}?from=${encodeURIComponent(here)}`);
	if (session.user.role !== 'admin') {
		return <AdminForbidden area="phòng test với bot" from={here} />;
	}
	return <TestRoomClient initialGame={game} initialCode={code} />;
}
