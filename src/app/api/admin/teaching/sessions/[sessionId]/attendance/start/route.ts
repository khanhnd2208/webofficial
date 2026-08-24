import { startAttendance } from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

export const POST = withAdmin(async (_request: NextRequest, user, context) =>
	apiSuccess(await startAttendance(String((await context!.params).sessionId), user.id)),
);
