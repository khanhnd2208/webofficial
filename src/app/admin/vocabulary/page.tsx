import { redirect } from 'next/navigation';

/**
 * Redirects to the unified vocabulary store management tab.
 * Admin CRUD for vocab sets lives at /vocabulary/store (Admin tab).
 */
export default function AdminVocabularyPage() {
	redirect('/vocabulary/store');
}
