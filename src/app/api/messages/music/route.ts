import { type NextRequest } from 'next/server';

import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { listMusicTracksForUser } from '@/services/messageMusicService';

export const runtime = 'nodejs';

export const GET = withAdmin(async (_request: NextRequest, user) => {
	const tracks = await listMusicTracksForUser(user.id);
	return apiSuccess(tracks);
});
