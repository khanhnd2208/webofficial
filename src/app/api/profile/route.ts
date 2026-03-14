import { NextResponse, type NextRequest } from 'next/server';

import { getApiUser } from '@/lib/apiAuth';
import { getMyProfile, updateMyProfile } from '@/services/userProfileService';

export async function GET(request: NextRequest) {
	try {
		const user = await getApiUser(request);
		if (!user?.id || !user.email) {
			return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
		}

		const profile = await getMyProfile({
			userId: user.id,
			email: user.email,
			name: user.name,
			image: user.image,
		});

		return NextResponse.json({ ok: true, data: profile });
	} catch (error) {
		return NextResponse.json(
			{ ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 400 }
		);
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const user = await getApiUser(request);
		if (!user?.id || !user.email) {
			return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
		}

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

		return NextResponse.json({ ok: true, data: profile });
	} catch (error) {
		return NextResponse.json(
			{ ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 400 }
		);
	}
}