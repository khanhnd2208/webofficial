import { NextResponse, type NextRequest } from 'next/server';

import { getApiUser } from '@/lib/apiAuth';
import { recordLogin, getStreak } from '@/services/streakService';

/**
 * POST /api/streak — record a login for today
 */
export async function POST(request: NextRequest) {
	try {
		const user = await getApiUser(request);
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
		const user = await getApiUser(request);
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
