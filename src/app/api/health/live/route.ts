import { NextResponse } from 'next/server';

import { getRequestId, withRequestId } from '@/lib/apiUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
	return withRequestId(NextResponse.json(
		{ ok: true, data: { status: 'live' } },
		{ status: 200, headers: { 'cache-control': 'no-store' } },
	), getRequestId(request));
}
