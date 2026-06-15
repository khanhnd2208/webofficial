import { withAuth, apiSuccess } from '@/lib/apiUtils';
import { deleteMusicTrack } from '@/services/messageMusicService';

export const runtime = 'nodejs';

export const DELETE = withAuth(async (_request, user, context) => {
	const { id } = await context!.params;
	await deleteMusicTrack(user.id, String(id));
	return apiSuccess({ deleted: true });
});
