import { type NextRequest } from 'next/server';

import { withAdmin, apiSuccess, apiError } from '@/lib/apiUtils';
import { uploadMusicTrack } from '@/services/messageMusicService';

export const runtime = 'nodejs';

export const POST = withAdmin(async (request: NextRequest, user) => {
	const form = await request.formData();
	const file = form.get('file');
	const label = form.get('label');

	if (!(file instanceof File)) {
		return apiError('Thiếu file nhạc', 400);
	}

	const created = await uploadMusicTrack(
		user.id,
		file,
		label == null ? undefined : String(label),
	);
	return apiSuccess(created, 201);
});
