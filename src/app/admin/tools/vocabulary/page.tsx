import { redirect } from 'next/navigation';

/**
 * Canonical admin Vocabulary entry.
 * Full isolation into features/tools happens in Phase 4; keep existing store UI for now.
 */
export default function AdminToolsVocabularyPage() {
	redirect('/vocabulary/store');
}
