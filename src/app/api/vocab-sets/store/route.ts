import { NextResponse, type NextRequest } from 'next/server';

import { getApiUser } from '@/lib/apiAuth';
import { listPublicSets, cloneVocabSet, getPublicSetById } from '@/services/vocabSetService';

/** GET /api/vocab-sets/store — list all public sets */
export async function GET() {
	try {
		const items = await listPublicSets();
		return NextResponse.json({ ok: true, data: { items, total: items.length } });
	} catch (error) {
		return NextResponse.json(
			{ ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 400 }
		);
	}
}

/** POST /api/vocab-sets/store — clone a public set */
export async function POST(request: NextRequest) {
	try {
		const user = await getApiUser(request);
		if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

		const body = await request.json();
		const { sourceId } = body;

		if (!sourceId) {
			return NextResponse.json({ ok: false, error: 'sourceId is required' }, { status: 400 });
		}

		// Verify the source set exists and is public
		const source = await getPublicSetById(sourceId);
		if (!source) {
			return NextResponse.json({ ok: false, error: 'Public set not found' }, { status: 404 });
		}

		const cloned = await cloneVocabSet({
			sourceId,
			ownerId: user.id,
			ownerName: user.name,
		});

		if (!cloned) {
			return NextResponse.json({ ok: false, error: 'Clone failed' }, { status: 400 });
		}

		return NextResponse.json({ ok: true, data: cloned }, { status: 201 });
	} catch (error) {
		return NextResponse.json(
			{ ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 400 }
		);
	}
}
