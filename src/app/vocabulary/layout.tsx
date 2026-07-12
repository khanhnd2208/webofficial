import { requireVocabAdminAccess } from '@/lib/requireVocabAdmin';

export default async function VocabularyLayout({ children }: { children: React.ReactNode }) {
	await requireVocabAdminAccess();
	return children;
}
