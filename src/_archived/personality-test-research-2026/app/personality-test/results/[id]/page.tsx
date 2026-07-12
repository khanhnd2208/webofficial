/* ════════════════════════════════════════════════════════════════════════
   /personality-test/results/[id] — View test results
   
   Server Component that:
   1. Checks auth
   2. Fetches the specific test session
   3. Renders the results dashboard
   ════════════════════════════════════════════════════════════════════════ */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { auth } from '@/lib/auth';
import { getTestSession } from '@/services/personalityTestService';
import PersonalityResultsDashboard from '@/components/personality-test/PersonalityResultsDashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Personality Test Results | HANOICAM',
	description: 'View your personality analysis results — OCEAN and Dark Triad.',
};

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function PersonalityTestResultsPage({ params }: PageProps) {
	// Auth is optional — anonymous users can view their results via direct link
	const session = await auth();
	const user = session?.user;

	const { id } = await params;
	const userId = user ? (user as { id: string }).id : '__anonymous__';
	const isAdmin = (user as { role?: string })?.role === 'admin';

	// For anonymous users, allow access to any session (they have the direct link)
	const testSession = await getTestSession(id, userId, !user || isAdmin);

	if (!testSession) {
		notFound();
	}

	return (
		<main className="min-h-screen">
			{/* Header */}
			<section className="border-b border-border">
				<div className="mx-auto max-w-4xl px-6 py-10 sm:py-14">
					<div className="flex items-center gap-3">
						<span className="text-3xl">🌟</span>
						<div>
							<p className="text-xs font-bold uppercase tracking-widest text-muted">
								Hồ sơ Tính cách của bạn <span className="font-normal normal-case italic">(Your Personality Profile)</span>
							</p>
							<h1 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
								{testSession.result?.archetype?.name ?? 'Hồ sơ Tính cách'}
							</h1>
							{testSession.result?.archetype?.tagline && (
								<p className="mt-1 text-sm italic text-muted">
									{testSession.result.archetype.tagline}
								</p>
							)}
						</div>
					</div>
				</div>
			</section>

			{/* Results Dashboard */}
			<section>
				<div className="mx-auto max-w-4xl px-6 py-8 sm:py-12">
					<PersonalityResultsDashboard session={testSession} />
				</div>
			</section>
		</main>
	);
}
