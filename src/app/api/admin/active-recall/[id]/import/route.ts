import {
	activeRecallImportSchema,
	importAdminRecallCards,
	previewAdminRecallImport,
} from '@/features/active-recall';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { parseSchema } from '@/shared/validation/parse';

export const POST = withAdmin(async (request, _user, context) => {
	const id = String((await context!.params).id);
	const requestedMode = request.nextUrl.searchParams.get('mode');
	const body = parseSchema(activeRecallImportSchema, {
		...(await request.json()),
		...(requestedMode ? { mode: requestedMode } : {}),
	});
	if (request.nextUrl.searchParams.get('dryRun') === '1') {
		return apiSuccess(await previewAdminRecallImport(id, body.text, body.mode));
	}
	return apiSuccess(await importAdminRecallCards(id, body));
});
