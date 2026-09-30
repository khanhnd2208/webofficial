import {
	createTestPlacement,
	listTestPlacements,
	parseWithAppError,
	testPlacementSchema,
} from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const GET = withAdmin(async (_request, _user, context) =>
	apiSuccess(await listTestPlacements(String((await context!.params).id))),
);

export const POST = withAdmin(async (request: NextRequest, _user, context) =>
	apiSuccess(
		await createTestPlacement(
			String((await context!.params).id),
			parseWithAppError(testPlacementSchema, await request.json()),
		),
		201,
	),
);
