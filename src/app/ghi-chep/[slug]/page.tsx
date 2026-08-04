import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StructuredData } from '@/components/marketing';
import { routes } from '@/config/routes';
import { SITE_NAME, absoluteUrl } from '@/config/site';
import {
	areNotesPublic,
	getPublishedNote,
	getRelatedNote,
	notes,
} from '@/content/notes';

type NotePageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
	return notes.filter((note) => note.status === 'published').map((note) => ({ slug: note.slug }));
}

export async function generateMetadata({ params }: NotePageProps): Promise<Metadata> {
	const { slug } = await params;
	const note = getPublishedNote(slug);
	if (!note) return {};
	return {
		title: note.title,
		description: note.excerpt,
		alternates: { canonical: absoluteUrl(routes.note(note.slug)) },
		openGraph: {
			title: note.title,
			description: note.excerpt,
			type: 'article',
			publishedTime: note.date,
		},
	};
}

export default async function NoteDetailPage({ params }: NotePageProps) {
	const { slug } = await params;
	if (!areNotesPublic()) notFound();
	const note = getPublishedNote(slug);
	if (!note) notFound();

	const related = getRelatedNote(note.slug);
	const dateLabel = new Intl.DateTimeFormat('vi-VN', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	}).format(new Date(note.date));

	return (
		<main className="bg-canvas">
			<StructuredData
				data={{
					'@context': 'https://schema.org',
					'@type': 'Article',
					headline: note.title,
					datePublished: note.date,
					description: note.excerpt,
					author: { '@type': 'Person', name: SITE_NAME },
					inLanguage: 'vi-VN',
				}}
			/>

			<article className="border-b border-hairline">
				<header className="shell max-w-[46rem] py-14 md:py-20">
					<p className="editorial-label">{note.pillar}</p>
					<h1 className="premium-display mt-5 text-ink">{note.title}</h1>
					<div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-secondary">
						<time dateTime={note.date}>{dateLabel}</time>
						<span>{note.readingTime} đọc</span>
					</div>
				</header>

				<div className="shell max-w-[46rem] pb-16 md:pb-24">
					<div className="prose-article space-y-6 text-[1.0625rem] leading-[1.8] text-ink md:text-[1.125rem]">
						{note.body.map((paragraph) => (
							<p key={paragraph.slice(0, 40)}>{paragraph}</p>
						))}
					</div>
				</div>
			</article>

			<section className="editorial-section">
				<div className="shell max-w-[46rem]">
					<p className="editorial-label">Một ghi chép khác</p>
					{related ? (
						<div className="mt-6 border-t border-hairline pt-6">
							<p className="editorial-label">{related.pillar}</p>
							<h2 className="type-h3 mt-3">
								<Link
									href={routes.note(related.slug)}
									className="transition-colors hover:text-accent"
								>
									{related.title}
								</Link>
							</h2>
							<p className="mt-3 text-base leading-[1.7] text-ink-secondary">{related.excerpt}</p>
						</div>
					) : (
						<Link href={routes.notes} className="editorial-text-link mt-6">
							Xem tất cả ghi chép <span aria-hidden>→</span>
						</Link>
					)}
				</div>
			</section>
		</main>
	);
}
