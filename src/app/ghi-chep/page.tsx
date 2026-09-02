import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { notesArchive } from '@/content/notes';

export const metadata: Metadata = {
	title: 'Ghi chép — My Hanoicam',
	description: notesArchive.subtitle,
	alternates: { canonical: absoluteUrl(routes.notes) },
	robots: { index: false, follow: false },
};

export default function NotesPage() {
	notFound();
}
