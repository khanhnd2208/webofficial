/* GET /api/personality-test/[id] — Get a specific test session result */
/* No login required — anyone with the session ID link can view results */

import { type NextRequest } from 'next/server';

import { withErrorHandling, apiSuccess, apiError } from '@/lib/apiUtils';
import { getApiUser } from '@/lib/apiAuth';
import { getTestSession } from '@/services/personalityTestService';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/personality-test/:id
 * Returns the full test session with results.
 * Anonymous users can view any session (they have the direct link).
 * Logged-in non-admin users can only see their own sessions.
 */
export const GET = withErrorHandling(async (request: NextRequest, context?) => {
	const { id } = await (context as RouteContext).params;

	if (!id || typeof id !== 'string') {
		return apiError('Session ID is required', 400);
	}

	const user = await getApiUser(request);
	const isAdmin = user?.role === 'admin';
	// Anonymous or admin → allow viewing any session; logged-in user → own only
	const allowAll = !user || isAdmin;

	const session = await getTestSession(id, user?.id ?? '__anonymous__', allowAll);

	if (!session) {
		return apiError('Test session not found', 404);
	}

	return apiSuccess(session);
});
