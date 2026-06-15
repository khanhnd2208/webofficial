import { type NextRequest } from 'next/server';

import { withAuth, apiSuccess } from '@/lib/apiUtils';
import { listMusicTracksForUser } from '@/services/messageMusicService';

export const runtime = 'nodejs';

export const GET = withAuth(async (_request: NextRequest, user) => {
	const tracks = await listMusicTracksForUser(user.id);
	return apiSuccess(tracks);
});
