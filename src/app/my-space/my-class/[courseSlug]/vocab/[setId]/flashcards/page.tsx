import { getAssignedVocabSet } from '@/features/my-class';
import VocabPracticeShell from '@/components/myclass/vocab/VocabPracticeShell';
import FlashcardsPage from '@/app/vocabulary/[id]/flashcards/page';
import { rethrowUnlessNotFound } from '@/lib/pageErrors';

export const dynamic = 'force-dynamic';

export default async function Page({
	params,
}: {
	params: Promise<{ courseSlug: string; setId: string }>;
}) {
	const { courseSlug, setId } = await params;
	let data;
	try {
		data = await getAssignedVocabSet(courseSlug, setId);
	} catch (error) {
		rethrowUnlessNotFound(error);
	}
	return (
		<VocabPracticeShell courseSlug={courseSlug} courseTitle={data.course.title}>
			<FlashcardsPage params={Promise.resolve({ id: setId })} />
		</VocabPracticeShell>
	);
}
