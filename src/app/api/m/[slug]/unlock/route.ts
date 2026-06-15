import { type NextRequest } from 'next/server';

import { withErrorHandling, apiSuccess } from '@/lib/apiUtils';
import { unlockMessage } from '@/services/messageService';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { slug } = await context!.params;
	const body = (await request.json()) as Record<string, unknown>;
	const password = String(body.password ?? '');

	const message = await unlockMessage(String(slug), password);
	return apiSuccess(message);
});
