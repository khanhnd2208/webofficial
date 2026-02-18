import { NextResponse } from 'next/server';

import { getFeedbackPage } from '@/services/feedbackService';

export async function GET() {
	try {
		const page = await getFeedbackPage();
		if (!page.isPublished) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
		}
		return NextResponse.json({ ok: true, data: page });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
