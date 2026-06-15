import { withErrorHandling, apiSuccess } from '@/lib/apiUtils';
import { getPublicMessage } from '@/services/messageService';

export const GET = withErrorHandling(async (_request, context) => {
	const { slug } = await context!.params;
	const message = await getPublicMessage(String(slug));
	return apiSuccess(message);
});
