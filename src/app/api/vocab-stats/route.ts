import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';

import { recordPracticeResults, getUserWordStats } from '@/services/wordStatsService';

async function getUser(request: NextRequest) {
	const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
	if (!token?.email) return null;
	return {
		id: String(token.sub),
		email: token.email,
		name: String(token.name ?? ''),
		role: String(token.role ?? 'student'),
	};
}

/**
 * POST /api/vocab-stats — record practice results for words
 * Body: { results: [{ word, correct, mode }] }
 */
export async function POST(request: NextRequest) {
	try {
		const user = await getUser(request);
		if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

		const body = await request.json();
		const results = body.results;

		if (!Array.isArray(results) || results.length === 0) {
			return NextResponse.json({ ok: false, error: 'results array is required' }, { status: 400 });
		}

		await recordPracticeResults(user.id, results);
		return NextResponse.json({ ok: true });
	} catch (error) {
		return NextResponse.json(
			{ ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 400 }
		);
	}
}

/**
 * GET /api/vocab-stats — get all word stats for the current user
 */
export async function GET(request: NextRequest) {
	try {
		const user = await getUser(request);
		if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

		const stats = await getUserWordStats(user.id);
		return NextResponse.json({ ok: true, data: stats });
	} catch (error) {
		return NextResponse.json(
			{ ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 400 }
		);
	}
}
