import { reactivateMembership, removeMembership } from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';

export const DELETE = withAdmin(async (_request, _user, context) =>
	apiSuccess(await removeMembership(String((await context!.params).membershipId))),
);

export const POST = withAdmin(async (_request, _user, context) =>
	apiSuccess(await reactivateMembership(String((await context!.params).membershipId))),
);
