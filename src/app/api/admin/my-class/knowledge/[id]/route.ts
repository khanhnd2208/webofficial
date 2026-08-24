import {
	archiveKnowledgeUnit,
	getAdminKnowledgeUnit,
	parseWithAppError,
	saveDraftRevision,
	saveDraftRevisionSchema,
} from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const GET = withAdmin(async (_request, _user, context) =>
	apiSuccess(await getAdminKnowledgeUnit(String((await context!.params).id))),
);

export const PATCH = withAdmin(async (request: NextRequest, _user, context) =>
	apiSuccess(
		await saveDraftRevision(
			String((await context!.params).id),
			parseWithAppError(saveDraftRevisionSchema, await request.json()),
		),
	),
);

export const DELETE = withAdmin(async (_request, _user, context) =>
	apiSuccess(await archiveKnowledgeUnit(String((await context!.params).id))),
);
