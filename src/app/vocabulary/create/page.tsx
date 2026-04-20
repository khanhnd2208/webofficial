import { redirect } from 'next/navigation';

// Set creation is managed by admin in the store management tab
export default function CreateVocabSetPage() {
	redirect('/vocabulary/store');
}
