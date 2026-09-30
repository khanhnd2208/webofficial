import { getAssignedVocabSet } from '@/features/my-class';
import VocabPracticeShell from '@/components/myclass/vocab/VocabPracticeShell';
import FillBlankPage from '@/app/vocabulary/[id]/fill-blank/page';
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
			<FillBlankPage params={Promise.resolve({ id: setId })} />
		</VocabPracticeShell>
	);
}
