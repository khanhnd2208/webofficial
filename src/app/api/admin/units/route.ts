import { NextResponse, type NextRequest } from 'next/server';

import { isAdmin } from '@/lib/apiAuth';
import { listUnits } from '@/services/unitService';

export async function GET(request: NextRequest) {
	try {
		if (!(await isAdmin(request))) {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}
		const items = await listUnits();
		return NextResponse.json({ ok: true, data: items });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}

export async function POST(request: NextRequest) {
	try {
		if (!(await isAdmin(request))) {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}
		return NextResponse.json(
			{ ok: false, error: 'Create units from within a course: POST /api/admin/courses/:courseId/units' },
			{ status: 400 }
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
