import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EditorialHero, NotePreview } from '@/components/marketing';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { areNotesPublic, getPublishedNotes, notesArchive } from '@/content/notes';

export const metadata: Metadata = {
	title: 'Ghi chép — My Hanoicam',
	description: notesArchive.subtitle,
	alternates: { canonical: absoluteUrl(routes.notes) },
};

export default function NotesPage() {
	if (!areNotesPublic()) notFound();
	const published = getPublishedNotes();

	return (
		<main className="bg-canvas">
			<EditorialHero
				eyebrow={notesArchive.eyebrow}
				title={notesArchive.title}
				lead={notesArchive.subtitle}
			/>
			<section className="editorial-section">
				<div className="shell max-w-3xl">
					{published.map((note) => (
						<NotePreview key={note.slug} note={note} />
					))}
				</div>
			</section>
		</main>
	);
}
