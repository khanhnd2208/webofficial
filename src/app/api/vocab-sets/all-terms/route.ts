import { type NextRequest } from 'next/server';

import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { getUserLibrary } from '@/services/vocabSetService';

/** GET /api/vocab-sets/all-terms — aggregate all words across all user's active sets */
export const GET = withAdmin(async (_request: NextRequest, user) => {
	const sets = await getUserLibrary(user.id);

	// Only include active sets
	const activeSets = sets.filter((s) => s.status === 'active');

	// Flatten words with set info, cap at 2000 to prevent memory bloat
	let allWords = activeSets.flatMap((set) =>
		set.words.map((w) => ({
			id: w.id,
			term: w.term,
			definition: w.definition,
			partOfSpeech: w.partOfSpeech,
			example: w.example,
			setId: set.id,
			setTitle: set.title,
		})),
	);

	const totalWords = allWords.length;
	if (allWords.length > 2000) {
		allWords = allWords.slice(0, 2000);
	}

	return apiSuccess({
		words: allWords,
		totalWords,
		totalSets: activeSets.length,
		truncated: totalWords > 2000,
	});
});
