'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type LessonNavigationProps = {
	courseId: string;
	unitId: string;
	currentLessonId: string;
};

type LessonItem = {
	id: string;
	title: string;
	unitId: string;
};

export default function LessonNavigation({ unitId, currentLessonId }: LessonNavigationProps) {
	const [lessons, setLessons] = useState<LessonItem[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadLessons() {
			try {
				const res = await fetch(`/api/lessons?unitId=${encodeURIComponent(unitId)}`);
				if (!res.ok) throw new Error('Failed to load lessons');
				const json = await res.json();
				if (json.ok && Array.isArray(json.data?.items)) {
					setLessons(json.data.items);
				}
			} catch (e) {
				console.error('Failed to load lessons:', e);
			} finally {
				setLoading(false);
			}
		}
		void loadLessons();
	}, [unitId]);

	if (loading) return null;

	const currentIndex = lessons.findIndex((l) => l.id === currentLessonId);
	const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
	const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

	if (!prevLesson && !nextLesson) return null;

	return (
		<div className="mt-12 flex items-center justify-between gap-4 border-t border-border pt-8">
			<div className="flex-1">
				{prevLesson ? (
					<Link
						href={`/courses/lessons/${encodeURIComponent(prevLesson.id)}`}
						className="group flex flex-col items-start rounded-lg border border-border p-4 transition-all hover:border-border-hover hover:shadow-md"
					>
						<div className="text-xs font-medium text-muted">← Bài trước</div>
						<div className="mt-1 font-medium group-hover:text-accent transition-colors">{prevLesson.title}</div>
					</Link>
				) : (
					<div />
				)}
			</div>
			<div className="flex-1 text-right">
				{nextLesson ? (
					<Link
						href={`/courses/lessons/${encodeURIComponent(nextLesson.id)}`}
						className="group inline-flex flex-col items-end rounded-lg border border-border p-4 transition-all hover:border-border-hover hover:shadow-md"
					>
						<div className="text-xs font-medium text-muted">Bài tiếp theo →</div>
						<div className="mt-1 font-medium group-hover:text-accent transition-colors">{nextLesson.title}</div>
					</Link>
				) : (
					<div />
				)}
			</div>
		</div>
	);
}
