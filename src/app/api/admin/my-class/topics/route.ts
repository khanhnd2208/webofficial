import { createTopic, createTopicSchema, listAdminTopics, parseWithAppError } from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const GET = withAdmin(async (request: NextRequest) =>
	apiSuccess(await listAdminTopics(request.nextUrl.searchParams.get('subjectId') ?? undefined)),
);

export const POST = withAdmin(async (request: NextRequest) =>
	apiSuccess(await createTopic(parseWithAppError(createTopicSchema, await request.json())), 201),
);
