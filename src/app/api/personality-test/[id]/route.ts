/* GET /api/personality-test/[id] — Get a specific test session result */

import { type NextRequest } from 'next/server';

import { withAuth, apiSuccess, apiError } from '@/lib/apiUtils';
import { getTestSession } from '@/services/personalityTestService';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/personality-test/:id
 * Returns the full test session with results.
 * Users can only see their own sessions (admins can see all).
 */
export const GET = withAuth(async (_request: NextRequest, user, context?) => {
	const { id } = await (context as RouteContext).params;

	if (!id || typeof id !== 'string') {
		return apiError('Session ID is required', 400);
	}

	const isAdmin = user.role === 'admin';
	const session = await getTestSession(id, user.id, isAdmin);

	if (!session) {
		return apiError('Test session not found', 404);
	}

	return apiSuccess(session);
});
