import { createSection, parseWithAppError, sectionInputSchema } from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const POST = withAdmin(async (request: NextRequest, _user, context) =>
	apiSuccess(
		await createSection(
			String((await context!.params).lessonId),
			parseWithAppError(sectionInputSchema, await request.json()),
		),
		201,
	),
);
