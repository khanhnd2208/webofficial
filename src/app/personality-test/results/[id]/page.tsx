/* ════════════════════════════════════════════════════════════════════════
   /personality-test/results/[id] — View test results
   
   Server Component that:
   1. Checks auth
   2. Fetches the specific test session
   3. Renders the results dashboard
   ════════════════════════════════════════════════════════════════════════ */

import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';

import { auth } from '@/lib/auth';
import { getTestSession } from '@/services/personalityTestService';
import PersonalityResultsDashboard from '@/components/personality-test/PersonalityResultsDashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Kết quả Personality Test | HANOICAM',
	description: 'Xem kết quả phân tích tính cách — OCEAN và Dark Triad.',
};

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function PersonalityTestResultsPage({ params }: PageProps) {
	const session = await auth();
	if (!session?.user) redirect('/login');

	const { id } = await params;
	const user = session.user;
	const isAdmin = (user as { role?: string }).role === 'admin';

	const testSession = await getTestSession(id, user.id, isAdmin);

	if (!testSession) {
		notFound();
	}

	return (
		<main className="min-h-screen">
			{/* Header */}
			<section className="border-b border-border">
				<div className="mx-auto max-w-4xl px-6 py-10 sm:py-14">
					<div className="flex items-center gap-3">
						<span className="text-3xl">📊</span>
						<div>
							<p className="text-xs font-bold uppercase tracking-widest text-muted">
								Kết quả phân tích
							</p>
							<h1 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
								{testSession.result?.archetype?.name ?? 'Personality Profile'}
							</h1>
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
