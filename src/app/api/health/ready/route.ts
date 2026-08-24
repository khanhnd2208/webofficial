import { NextResponse } from 'next/server';

import { getRequestId, withRequestId } from '@/lib/apiUtils';
import { mongoClientPromise } from '@/lib/mongodbClient';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
	const requestId = getRequestId(request);
	try {
		const client = await mongoClientPromise;
		await Promise.all([client.db().command({ ping: 1 }), prisma.$queryRaw`SELECT 1`]);
		return withRequestId(NextResponse.json(
			{ ok: true, data: { status: 'ready' } },
			{ status: 200, headers: { 'cache-control': 'no-store' } },
		), requestId);
	} catch (error) {
		console.error('[health.ready]', {
			name: error instanceof Error ? error.name : 'UnknownError',
		});
		return withRequestId(NextResponse.json(
			{ ok: false, error: 'Service unavailable', code: 'NOT_READY' },
			{ status: 503, headers: { 'cache-control': 'no-store' } },
		), requestId);
	}
}
