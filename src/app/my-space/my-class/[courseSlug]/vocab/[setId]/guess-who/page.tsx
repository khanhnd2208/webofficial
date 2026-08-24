import Link from 'next/link';
import { getAssignedVocabSet } from '@/features/my-class';
import VocabPracticeShell from '@/components/myclass/vocab/VocabPracticeShell';
import GuessWhoPage from '@/app/vocabulary/[id]/guess-who/page';
import { routes } from '@/config/routes';
import { rethrowUnlessNotFound } from '@/lib/pageErrors';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ courseSlug: string; setId: string }> }) {
	const { courseSlug, setId } = await params;
	let data;
	try {
		data = await getAssignedVocabSet(courseSlug, setId);
	} catch (error) {
		rethrowUnlessNotFound(error);
	}
	if (!data.set.words.some((word) => word.hintsHard.length + word.hintsMedium.length + word.hintsEasy.length > 0)) {
		return (
			<VocabPracticeShell courseSlug={courseSlug} courseTitle={data.course.title}>
				<div className="border border-dashed border-mc-rule p-8 text-center">
					<p className="mc-title text-[clamp(1.35rem,2vw,1.75rem)]">Bộ từ chưa có gợi ý cho Guess Who</p>
					<p className="mc-meta mt-2">Chọn chế độ luyện khác hoặc quay lại danh sách từ.</p>
					<Link
						href={routes.myClassVocab(courseSlug, setId)}
						className="mt-5 inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-sm font-semibold text-paper"
					>
						Về danh sách từ
					</Link>
				</div>
			</VocabPracticeShell>
		);
	}
	return (
		<VocabPracticeShell courseSlug={courseSlug} courseTitle={data.course.title}>
			<GuessWhoPage params={Promise.resolve({ id: setId })} />
		</VocabPracticeShell>
	);
}
