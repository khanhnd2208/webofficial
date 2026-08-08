import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AppError } from '@/lib/appError';
import { routes } from '@/config/routes';
import { myspaceTestsService, type SessionStartResult } from '@/features/myspace-tests';
import QuizPlayClient from './QuizPlayClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Take test | Tests',
	robots: { index: false, follow: false },
};

export default async function MySpaceTestPlayPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;

	let session: SessionStartResult;
	try {
		session = await myspaceTestsService.preparePlay(slug);
	} catch (err) {
		if (err instanceof AppError && err.status === 404) notFound();
		if (err instanceof AppError) {
			return (
				<main className="flex min-h-svh flex-col items-center justify-center bg-canvas px-6 text-center">
					<p className="font-sans text-sm text-ink/70">{err.message}</p>
					<Link
						href={routes.mySpaceTests}
						className="mt-8 font-sans text-sm text-ink-secondary"
					>
						← Tests
					</Link>
				</main>
			);
		}
		throw err;
	}

	return <QuizPlayClient slug={slug} initialSession={session} />;
}
