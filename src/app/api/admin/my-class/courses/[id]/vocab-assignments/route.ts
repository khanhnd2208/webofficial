import {
	assignVocabSet,
	listCourseVocabAssignments,
	parseWithAppError,
	searchVocabSets,
	vocabAssignmentSchema,
} from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const GET = withAdmin(async (request: NextRequest, _user, context) => {
	const courseId = String((await context!.params).id);
	const q = request.nextUrl.searchParams.get('q');
	if (q !== null) return apiSuccess(await searchVocabSets(q, { courseId }));
	return apiSuccess(await listCourseVocabAssignments(courseId));
});

export const POST = withAdmin(async (request: NextRequest, _user, context) => {
	const courseId = String((await context!.params).id);
	const body = parseWithAppError(vocabAssignmentSchema, await request.json());
	return apiSuccess(await assignVocabSet(courseId, body), 201);
});
