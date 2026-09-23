import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Current release id, compared by open tabs against `<html data-dpl-id>`. */
export async function GET() {
	return NextResponse.json(
		{ ok: true, data: { deploymentId: process.env.NEXT_DEPLOYMENT_ID ?? null } },
		{ status: 200, headers: { 'cache-control': 'no-store' } },
	);
}
