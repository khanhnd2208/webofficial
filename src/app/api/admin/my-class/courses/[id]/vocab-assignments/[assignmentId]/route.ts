import {
	parseWithAppError,
	unassignVocabSet,
	updateVocabAssignment,
	updateVocabAssignmentSchema,
} from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const PATCH = withAdmin(async (request: NextRequest, _user, context) => {
	const { id, assignmentId } = await context!.params;
	const body = parseWithAppError(updateVocabAssignmentSchema, await request.json());
	return apiSuccess(await updateVocabAssignment(String(id), String(assignmentId), body));
});

export const DELETE = withAdmin(async (_request, _user, context) => {
	const { id, assignmentId } = await context!.params;
	return apiSuccess(await unassignVocabSet(String(id), String(assignmentId)));
});
