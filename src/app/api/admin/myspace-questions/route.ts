import { type NextRequest } from 'next/server';

import { myspaceTestsService } from '@/features/myspace-tests';
import { withAdmin, apiSuccess } from '@/lib/apiUtils';

export const GET = withAdmin(async (request: NextRequest) => {
	const { searchParams } = new URL(request.url);
	const subjectId = searchParams.get('subjectId') ?? undefined;
	const topic = searchParams.get('topic') ?? undefined;
	const q = searchParams.get('q') ?? undefined;
	const isActiveParam = searchParams.get('isActive');
	const take = Number(searchParams.get('take') ?? 50);
	const skip = Number(searchParams.get('skip') ?? 0);

	const isActive =
		isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined;

	const result = await myspaceTestsService.listQuestions({
		subjectId,
		topic,
		q,
		isActive,
		take: Number.isFinite(take) ? take : 50,
		skip: Number.isFinite(skip) ? skip : 0,
	});
	return apiSuccess(result);
});
