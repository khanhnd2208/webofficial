import { NextResponse, type NextRequest } from 'next/server';

import { getApiUser } from '@/lib/apiAuth';
import { listMyVocabSetsWithTerms } from '@/services/vocabSetService';

/** GET /api/vocab-sets/all-terms — aggregate all terms across all user's sets */
export async function GET(request: NextRequest) {
	try {
		const user = await getApiUser(request);
		if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
		const sets = await listMyVocabSetsWithTerms(user.id);

		// Flatten terms with set info, cap at 2000 to prevent memory bloat
		let allTerms = sets.flatMap((set) =>
			set.terms.map((term) => ({
				...term,
				setId: set.id,
				setTitle: set.title,
			}))
		);

		const totalTerms = allTerms.length;
		if (allTerms.length > 2000) {
			allTerms = allTerms.slice(0, 2000);
		}

		return NextResponse.json({
			ok: true,
			data: {
				terms: allTerms,
				totalTerms,
				totalSets: sets.length,
				truncated: totalTerms > 2000,
			},
		});
	} catch (error) {
		return NextResponse.json(
			{ ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 400 }
		);
	}
}
