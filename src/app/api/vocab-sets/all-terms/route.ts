import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';

import { listMyVocabSetsWithTerms } from '@/services/vocabSetService';

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

/** GET /api/vocab-sets/all-terms — aggregate all terms across all user's sets */
export async function GET(request: NextRequest) {
	try {
		const user = await getUser(request);
		if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
		const sets = await listMyVocabSetsWithTerms(user.id);

		// Flatten terms with set info
		const allTerms = sets.flatMap((set) =>
			set.terms.map((term) => ({
				...term,
				setId: set.id,
				setTitle: set.title,
			}))
		);

		return NextResponse.json({
			ok: true,
			data: {
				terms: allTerms,
				totalTerms: allTerms.length,
				totalSets: sets.length,
			},
		});
	} catch (error) {
		return NextResponse.json(
			{ ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 400 }
		);
	}
}
