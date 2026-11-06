import { type NextRequest } from 'next/server';

import { assertUnreleasedOpen } from '@/features/unreleased-quiz/availability';
import { submissionSchema } from '@/features/unreleased-quiz/domain/submission';
import { recordResponse } from '@/features/unreleased-quiz/services/responseService';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { parseSchema } from '@/lib/validation/parse';

/** Anonymous: stores the answers and the server-computed group, nothing about the person. */
export const POST = withErrorHandling(async (request: NextRequest) => {
	assertUnreleasedOpen();
	const body: unknown = await request.json();
	const input = parseSchema(submissionSchema, body);
	const created = await recordResponse(input);
	return apiSuccess(created, 201);
});
