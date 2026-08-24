import { publishTest, validateAdminTestPublish } from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';

export const GET = withAdmin(async (_request, _user, context) =>
	apiSuccess(await validateAdminTestPublish(String((await context!.params).id))),
);

export const POST = withAdmin(async (_request, _user, context) =>
	apiSuccess(await publishTest(String((await context!.params).id))),
);
