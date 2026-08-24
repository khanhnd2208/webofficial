import { getAttendanceBoardConfig } from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';

async function classId(context?: { params: Promise<{ classId: string }> }) {
	return String((await context!.params).classId);
}

export const GET = withAdmin(async (_request, _user, context) =>
	apiSuccess(await getAttendanceBoardConfig(await classId(context))),
);
