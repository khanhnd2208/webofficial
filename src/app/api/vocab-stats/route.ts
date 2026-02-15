import { NextResponse, type NextRequest } from 'next/server';

import { getApiUser } from '@/lib/apiAuth';
import { recordPracticeResults, getUserWordStats } from '@/services/wordStatsService';

/**
 * POST /api/vocab-stats — record practice results for words
 * Body: { results: [{ word, correct, mode }] }
 */
export async function POST(request: NextRequest) {
	try {
		const user = await getApiUser(request);
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
		const user = await getApiUser(request);
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
