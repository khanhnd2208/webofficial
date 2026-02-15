import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';

import { recordLogin, getStreak } from '@/services/streakService';

async function getUser(request: NextRequest) {
	const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
	if (!token?.sub) return null;
	return { id: String(token.sub) };
}

/**
 * POST /api/streak — record a login for today
 */
export async function POST(request: NextRequest) {
	try {
		const user = await getUser(request);
		if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

		const data = await recordLogin(user.id);
		return NextResponse.json({ ok: true, data });
	} catch (error) {
		return NextResponse.json(
			{ ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
}

/**
 * GET /api/streak — get current streak data
 */
export async function GET(request: NextRequest) {
	try {
		const user = await getUser(request);
		if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

		const data = await getStreak(user.id);
		return NextResponse.json({ ok: true, data });
	} catch (error) {
		return NextResponse.json(
			{ ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
}
