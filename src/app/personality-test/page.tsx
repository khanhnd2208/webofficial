/* ════════════════════════════════════════════════════════════════════════
   /personality-test — Main personality test page
   
   Server Component that:
   1. Checks auth (redirects to /login if not signed in)
   2. Fetches test config and user history from service
   3. Renders the client-side test wizard
   ════════════════════════════════════════════════════════════════════════ */

import type { Metadata } from 'next';

import { auth } from '@/lib/auth';
import {
	getPersonalityTestConfig,
	getUserTestHistory,
} from '@/services/personalityTestService';
import PersonalityTestClient from '@/components/personality-test/PersonalityTestClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Personality Test — Dual Assessment | HANOICAM',
	description:
		'Dual personality assessment: BFI-2-S (OCEAN) and Short Dark Triad (SD3). Discover your strengths and blind spots in a career context.',
};

export default async function PersonalityTestPage() {
	// Auth is optional — anonymous users can take the test
	const session = await auth();
	const user = session?.user;

	const [config, history] = await Promise.all([
		getPersonalityTestConfig(),
		user?.id ? getUserTestHistory((user as { id: string }).id) : Promise.resolve([]),
	]);

	return (
		<main className="min-h-screen">
			{/* Hero Header */}
			<section className="border-b border-border">
				<div className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
					<div className="flex items-center gap-3">
						<span className="text-3xl">🪞</span>
						<div>
							<p className="text-xs font-bold uppercase tracking-widest text-muted">
								Organizational Behavior
							</p>
							<h1 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
								Personality Assessment
							</h1>
						</div>
					</div>
					<p className="mt-3 text-sm text-muted leading-relaxed max-w-xl">
						Discover your strengths, blind spots, and working style through two
						widely-researched psychology models — Big Five (BFI-2-S) and Dark Triad (SD3).
					</p>
				</div>
			</section>

			{/* Content */}
			<section>
				<div className="mx-auto max-w-3xl px-6 py-8 sm:py-12">
					<PersonalityTestClient config={config} history={history} />
				</div>
			</section>
		</main>
	);
}
