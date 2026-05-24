'use client';

/* ════════════════════════════════════════════════════════════════════════
   PersonalityTestClient — Client-side orchestrator
   
   Manages the test flow:
   1. Render the test wizard
   2. Submit responses and redirect to results
   3. No login required — anonymous users can take the test
   ════════════════════════════════════════════════════════════════════════ */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import PersonalityTestWizard from '@/components/personality-test/PersonalityTestWizard';
import PersonalityTestHistory from '@/components/personality-test/PersonalityTestHistory';
import AprilFoolsPopup from '@/components/personality-test/AprilFoolsPopup';
import { generateDeviceFingerprint } from '@/utils/deviceFingerprint';
import type { TestConfigDTO, PersonalityTestHistoryDTO, RawResponse, DemographicData } from '@/types/personalityTest';

const STORAGE_KEY = 'personality-test-progress';

interface Props {
	config: TestConfigDTO;
	history: PersonalityTestHistoryDTO[];
}

export default function PersonalityTestClient({ config, history }: Props) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const fingerprintRef = useRef<string | null>(null);

	// Pre-compute device fingerprint on mount (non-blocking)
	useEffect(() => {
		generateDeviceFingerprint()
			.then(fp => { fingerprintRef.current = fp; })
			.catch(() => { /* fingerprint is best-effort */ });
	}, []);

	const handleSubmit = useCallback(
		async (demographics: DemographicData, responses: RawResponse[], durationSeconds: number) => {
			setIsSubmitting(true);
			setError(null);

			try {
				const res = await fetch('/api/personality-test', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						demographics,
						responses,
						durationSeconds,
						deviceFingerprint: fingerprintRef.current,
					}),
				});

				const json = await res.json();

				if (!json.ok) {
					setError(json.error || 'An error occurred while submitting the test');
					setIsSubmitting(false);
					return;
				}

				// Clear saved progress on successful submission
				try { localStorage.removeItem(STORAGE_KEY); } catch {}

				// Redirect to results page
				router.push(`/personality-test/results/${json.data.id}`);
			} catch {
				setError('Connection error. Your answers are auto-saved — you can try again when online.');
				setIsSubmitting(false);
			}
		},
		[router]
	);

	return (
		<div className="space-y-8">
			{/* April Fools' Day Popup — only renders on 1/4 */}
			<AprilFoolsPopup />

			{/* Error Banner */}
			{error && (
				<div className="rounded-xl border border-error/30 bg-error-subtle p-4 text-center">
					<p className="text-sm font-bold text-error">{error}</p>
				</div>
			)}

			{/* Test Wizard */}
			<PersonalityTestWizard
				config={config}
				onSubmit={handleSubmit}
				isSubmitting={isSubmitting}
			/>

			{/* Test History (only shows if user is logged in and has history) */}
			{history.length > 0 && <PersonalityTestHistory history={history} />}
		</div>
	);
}
