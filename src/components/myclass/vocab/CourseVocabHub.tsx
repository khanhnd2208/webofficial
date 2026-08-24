import Link from 'next/link';
import { routes } from '@/config/routes';
import type { MyClassVocabSetCard } from '@/features/my-class';

export default function CourseVocabHub({
	courseSlug,
	sets,
}: {
	courseSlug: string;
	sets: MyClassVocabSetCard[];
}) {
	const visible = sets.filter((item) => !item.isArchived);
	const courseSets = visible.filter((item) => item.scope === 'course');
	const byLesson = new Map<string, MyClassVocabSetCard[]>();
	for (const item of visible.filter((row) => row.scope === 'lesson')) {
		const key = item.lessonSlug ?? item.lessonId ?? '';
		byLesson.set(key, [...(byLesson.get(key) ?? []), item]);
	}
	if (!visible.length) {
		return (
			<div className="mt-6 rounded-[var(--mc-r-lg)] border border-dashed border-hairline p-8 text-sm text-ink-secondary">
				Chưa có bộ từ vựng.
			</div>
		);
	}
	return (
		<div className="mt-6 space-y-6" data-testid="my-class-vocab-hub">
			{courseSets.length ? (
				<section>
					<p className="text-xs font-semibold uppercase tracking-[0.14em] text-mc-vocab">Toàn khóa</p>
					<div className="mt-3 grid gap-3 sm:grid-cols-2">
						{courseSets.map((set) => (
							<VocabRow key={set.assignmentId} courseSlug={courseSlug} set={set} />
						))}
					</div>
				</section>
			) : null}
			{[...byLesson.entries()].map(([lessonSlug, rows]) => (
				<section key={lessonSlug}>
					<p className="text-xs font-semibold uppercase tracking-[0.14em] text-mc-vocab">
						{rows[0]?.lessonTitle ?? 'Theo bài'}
					</p>
					<div className="mt-3 grid gap-3 sm:grid-cols-2">
						{rows.map((set) => (
							<VocabRow key={set.assignmentId} courseSlug={courseSlug} set={set} />
						))}
					</div>
				</section>
			))}
		</div>
	);
}

function VocabRow({ courseSlug, set }: { courseSlug: string; set: MyClassVocabSetCard }) {
	return (
		<Link
			href={routes.myClassVocab(courseSlug, set.vocabSetId)}
			className="block border border-mc-rule px-4 py-3 transition-colors hover:bg-surface-sunken"
		>
			<p className="font-semibold text-ink">{set.title}</p>
			<p className="mc-meta mt-1">
				<span className="mc-num">{set.wordCount}</span> từ
			</p>
		</Link>
	);
}
