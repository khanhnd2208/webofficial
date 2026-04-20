/* ════════════════════════════════════════════════════════════════════════
   Vocabulary Types — API DTOs
   
   These are the shapes returned to the client. They are derived from
   Prisma-generated types but stripped of internal fields.
   ════════════════════════════════════════════════════════════════════════ */

// ─── Practice Modes ───────────────────────────────────────────────────────────
export type PracticeMode = 'flashcards' | 'mcq' | 'fill-blank' | 'matching' | 'guess-who';

// ─── Word ─────────────────────────────────────────────────────────────────────
export interface WordDTO {
	id: string;
	term: string;
	definition: string;
	partOfSpeech: string;
	example: string;
	// v2: NDK's Explanation & Guess Who hints
	ndkExplanation: string | null;
	hintsHard: string[];
	hintsMedium: string[];
	hintsEasy: string[];
}

// ─── VocabSet ─────────────────────────────────────────────────────────────────
export interface VocabSetDTO {
	id: string;
	title: string;
	description: string;
	ownerId: string;
	ownerName: string;
	words: WordDTO[];
	wordCount: number;
	isArchived: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface VocabSetListItemDTO {
	id: string;
	title: string;
	description: string;
	ownerId: string;
	ownerName: string;
	wordCount: number;
	isArchived: boolean;
	createdAt: string;
	updatedAt: string;
}

// ─── Store (public listing) ───────────────────────────────────────────────────
export interface StoreSetDTO extends VocabSetListItemDTO {
	/** Whether the current user already has this set in their library (active) */
	alreadyOwned: boolean;
}

export interface StoreListResult {
	items: StoreSetDTO[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

// ─── User Library ─────────────────────────────────────────────────────────────
export type UserVocabSetStatus = 'active' | 'soft_deleted';

export interface UserLibrarySetDTO extends VocabSetDTO {
	libraryEntryId: string;
	status: UserVocabSetStatus;
	addedAt: string;
}

// ─── Create / Update inputs ───────────────────────────────────────────────────
export interface CreateWordInput {
	term: string;
	definition: string;
	partOfSpeech?: string;
	example?: string;
	// v2: NDK's Explanation & Guess Who hints
	ndkExplanation?: string | null;
	hintsHard?: string[];
	hintsMedium?: string[];
	hintsEasy?: string[];
}

export interface CreateVocabSetInput {
	title: string;
	description?: string;
	words: CreateWordInput[];
}

export interface UpdateVocabSetInput {
	title?: string;
	description?: string;
	/** Toggle archive status (true = private/archived, false = public) */
	isArchived?: boolean;
	/** Words to upsert (by id if updating, no id for new) */
	words?: Array<CreateWordInput & { id?: string }>;
	/** Word IDs to soft-delete */
	deleteWordIds?: string[];
}
