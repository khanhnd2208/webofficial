import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
	return [] as Array<{ slug: string }>;
}

export function generateMetadata(): Metadata {
	return {
		title: 'Ghi chép',
		robots: { index: false, follow: false },
	};
}

export default function NoteDetailPage() {
	notFound();
}
