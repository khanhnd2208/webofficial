import { type NextRequest } from 'next/server';

import { withAuth, apiSuccess } from '@/lib/apiUtils';
import { listMyVocabSetsWithTerms } from '@/services/vocabSetService';

/** GET /api/vocab-sets/all-terms — aggregate all terms across all user's sets */
export const GET = withAuth(async (_request: NextRequest, user) => {
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

	return apiSuccess({
		terms: allTerms,
		totalTerms,
		totalSets: sets.length,
		truncated: totalTerms > 2000,
	});
});
