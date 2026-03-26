import { type NextRequest } from 'next/server';

import { withAuth, apiSuccess } from '@/lib/apiUtils';
import { getMyProfile, updateMyProfile } from '@/services/userProfileService';

export const GET = withAuth(async (request: NextRequest, user) => {
	const profile = await getMyProfile({
		userId: user.id,
		email: user.email,
		name: user.name,
		image: user.image,
	});

	return apiSuccess(profile);
});

export const PATCH = withAuth(async (request: NextRequest, user) => {
	const body = (await request.json()) as {
		dateOfBirth?: string | null;
		university?: string;
		major?: string;
		bio?: string;
	};

	const profile = await updateMyProfile(
		{
			userId: user.id,
			email: user.email,
			name: user.name,
			image: user.image,
		},
		{
			dateOfBirth: body.dateOfBirth,
			university: body.university,
			major: body.major,
			bio: body.bio,
		}
	);

	return apiSuccess(profile);
});