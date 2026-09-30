import { type NextRequest } from 'next/server';

import { myspaceTestsService, startSessionSchema } from '@/features/myspace-tests';
import { resolvePlayActor } from '@/features/myspace-tests/resolvePlayActor';
import { withErrorHandling, apiSuccess } from '@/lib/apiUtils';
import { parseSchema } from '@/lib/validation/parse';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { slug } = await context!.params;
	const raw: unknown = await request.json().catch(() => ({}));
	const body = raw && typeof raw === 'object' ? raw : {};
	const input = parseSchema(startSessionSchema, body);
	const persist = input.persist ?? true;
	const actor = await resolvePlayActor(request, { ensureGuest: persist });
	const session = await myspaceTestsService.startSession(String(slug), input, {
		userId: actor.userId,
		guestId: actor.userId ? null : actor.guestId,
	});
	return apiSuccess(session, 201);
});
