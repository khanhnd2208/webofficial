import {
	addMembership,
	membershipInputSchema,
	parseWithAppError,
	previewRoster,
	rosterCommitSchema,
	commitRoster,
} from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const POST = withAdmin(async (request: NextRequest, _user, context) => {
	const id = String((await context!.params).id);
	const body = (await request.json()) as Record<string, unknown>;
	if (body.mode === 'preview') {
		const parsed = parseWithAppError(rosterCommitSchema, body);
		return apiSuccess(await previewRoster(id, parsed.rows));
	}
	if (body.mode === 'commit') {
		const parsed = parseWithAppError(rosterCommitSchema, body);
		return apiSuccess(await commitRoster(id, parsed.rows), 201);
	}
	const parsed = parseWithAppError(membershipInputSchema, body);
	return apiSuccess(await addMembership(id, parsed.email, parsed.name), 201);
});
