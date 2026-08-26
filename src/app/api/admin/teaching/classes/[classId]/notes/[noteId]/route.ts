import {
	deleteClassNote,
	parseWithAppError,
	updateClassNote,
	updateTeachingClassNoteSchema,
} from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

async function params(context?: { params: Promise<{ classId: string; noteId: string }> }) {
	return await context!.params;
}

export const PATCH = withAdmin(async (request: NextRequest, _user, context) => {
	const { classId, noteId } = await params(context);
	return apiSuccess(
		await updateClassNote(
			classId,
			noteId,
			parseWithAppError(updateTeachingClassNoteSchema, await request.json()),
		),
	);
});

export const DELETE = withAdmin(async (_request, _user, context) => {
	const { classId, noteId } = await params(context);
	return apiSuccess(await deleteClassNote(classId, noteId));
});
