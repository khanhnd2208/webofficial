import Link from 'next/link';
import { getAssignedVocabLibraryState, getAssignedVocabSet } from '@/features/my-class';
import VocabPracticeShell from '@/components/myclass/vocab/VocabPracticeShell';
import SaveToLibraryButton from '@/components/myclass/vocab/SaveToLibraryButton';
import { routes } from '@/config/routes';
import { guessWhoReady } from '@/features/my-class/domain/vocabScope';
import { auth } from '@/lib/auth';
import { rethrowUnlessNotFound } from '@/lib/pageErrors';

export const dynamic = 'force-dynamic';

export default async function MyClassVocabSetPage({ params }: { params: Promise<{ courseSlug: string; setId: string }> }) {
	const { courseSlug, setId } = await params;
	let data;
	try {
		data = await getAssignedVocabSet(courseSlug, setId);
	} catch (error) {
		rethrowUnlessNotFound(error);
	}
	const session = await auth();
	const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
	const library = await getAssignedVocabLibraryState(userId, setId);
	const base = routes.myClassVocab(courseSlug, setId);
	const modes = [
		{ href: `${base}/flashcards`, title: 'Flashcards', detail: 'Lật thẻ để nhớ từ', icon: '▤' },
		{ href: `${base}/mcq`, title: 'Trắc nghiệm', detail: 'Chọn nghĩa đúng', icon: '☑' },
		{ href: `${base}/fill-blank`, title: 'Điền từ', detail: 'Viết lại từ còn thiếu', icon: '␣' },
		{ href: `${base}/matching`, title: 'Ghép cặp', detail: 'Nối từ với định nghĩa', icon: '⇄' },
		{ href: `${base}/guess-who`, title: 'Guess Who', detail: 'Đoán từ từ gợi ý', icon: '?', show: guessWhoReady(data.set.words) },
	];
	return (
		<VocabPracticeShell courseSlug={courseSlug} courseTitle={data.course.title}>
			<h1 className="mc-title">{data.set.title}</h1>
			<p className="mc-meta mt-2">
				<span className="mc-num">{data.set.wordCount}</span> từ
			</p>
			<div className="mt-5">
				<SaveToLibraryButton
					courseSlug={courseSlug}
					setId={setId}
					initialSaved={library.saved}
					signedIn={Boolean(userId)}
				/>
			</div>
			<div className="mt-8 divide-y divide-mc-rule border-y border-mc-rule">
				{modes.filter((mode) => mode.show !== false).map((mode) => (
					<Link
						key={mode.href}
						href={mode.href}
						className="flex min-h-14 items-center gap-3 px-1 py-3 transition-colors hover:bg-surface-sunken"
					>
						<span
							className="mc-num flex h-8 w-8 shrink-0 items-center justify-center border border-mc-rule text-sm font-semibold text-ink"
							aria-hidden
						>
							{mode.icon}
						</span>
						<span>
							<p className="font-semibold text-ink">{mode.title}</p>
							<p className="mc-meta mt-0.5">{mode.detail}</p>
						</span>
					</Link>
				))}
			</div>
			<ul className="mt-10 divide-y divide-mc-rule border-y border-mc-rule">
				{data.set.words.map((word) => (
					<li key={word.id} className="px-1 py-3">
						<p className="font-semibold text-ink">
							{word.term}
							{word.pronunciation ? (
								<span className="ml-2 font-normal text-ink-secondary">{word.pronunciation}</span>
							) : null}
						</p>
						{word.meaningEn ? <p className="mc-meta mt-0.5">{word.meaningEn}</p> : null}
						<p className="mt-0.5 text-sm text-ink-secondary">{word.meaningVi || word.definition}</p>
					</li>
				))}
			</ul>
		</VocabPracticeShell>
	);
}
