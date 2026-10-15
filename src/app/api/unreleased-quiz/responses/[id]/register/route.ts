import { type NextRequest } from 'next/server';
import { z } from 'zod';

import { respondentIdSchema } from '@/features/unreleased-quiz/domain/submission';
import { markRegisterClick } from '@/features/unreleased-quiz/services/responseService';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { parseSchema } from '@/lib/validation/parse';

const bodySchema = z.object({ respondentId: respondentIdSchema });
const idSchema = z.uuid();

/** Records that this result's "Đăng ký" button was clicked. Sent with sendBeacon. */
export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { id } = (await context!.params) as { id: string };
	const responseId = parseSchema(idSchema, id);
	const body: unknown = JSON.parse((await request.text()) || '{}');
	const { respondentId } = parseSchema(bodySchema, body);
	await markRegisterClick(responseId, respondentId);
	return apiSuccess({ recorded: true });
});
