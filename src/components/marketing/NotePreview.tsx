import Link from 'next/link';

import { routes } from '@/config/routes';
import type { Note } from '@/content/notes';

type NotePreviewProps = {
	note: Note;
	className?: string;
};

export function NotePreview({ note, className = '' }: NotePreviewProps) {
	const dateLabel = new Intl.DateTimeFormat('vi-VN', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	}).format(new Date(note.date));

	return (
		<article className={`border-t border-hairline py-8 ${className}`}>
			<div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
				<time dateTime={note.date} className="text-sm text-ink-secondary">
					{dateLabel}
				</time>
				<span className="editorial-label">{note.pillar}</span>
			</div>
			<h2 className="type-h3 mt-4">
				<Link href={routes.note(note.slug)} className="transition-colors hover:text-accent">
					{note.title}
				</Link>
			</h2>
			<p className="mt-4 max-w-2xl text-base leading-[1.7] text-ink-secondary">{note.excerpt}</p>
			<p className="mt-4 text-sm text-ink-secondary">{note.readingTime} đọc</p>
		</article>
	);
}
