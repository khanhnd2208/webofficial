import {
	createClassNote,
	createTeachingClassNoteSchema,
	getClassNotes,
	parseWithAppError,
	reorderClassNotes,
	reorderTeachingClassNotesSchema,
} from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

async function params(context?: { params: Promise<{ classId: string }> }) {
	return (await context!.params).classId;
}

export const GET = withAdmin(async (_request, _user, context) =>
	apiSuccess(await getClassNotes(await params(context))),
);

export const POST = withAdmin(async (request: NextRequest, _user, context) =>
	apiSuccess(
		await createClassNote(
			await params(context),
			parseWithAppError(createTeachingClassNoteSchema, await request.json()),
		),
		201,
	),
);

export const PUT = withAdmin(async (request: NextRequest, _user, context) =>
	apiSuccess(
		await reorderClassNotes(
			await params(context),
			parseWithAppError(reorderTeachingClassNotesSchema, await request.json()),
		),
	),
);
