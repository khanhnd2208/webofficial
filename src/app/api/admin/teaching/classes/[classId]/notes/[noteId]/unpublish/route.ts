import { unpublishClassNote } from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';

export const POST = withAdmin(async (_request, _user, context) => {
	const { classId, noteId } = await context!.params;
	return apiSuccess(await unpublishClassNote(classId, noteId));
});
