'use client';

/* ════════════════════════════════════════════════════════════════════════
   PersonalityTestClient — Client-side orchestrator
   
   Manages the test flow:
   1. Fetch config & history from API
   2. Render the test wizard
   3. Submit responses and redirect to results
   ════════════════════════════════════════════════════════════════════════ */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import PersonalityTestWizard from '@/components/personality-test/PersonalityTestWizard';
import PersonalityTestHistory from '@/components/personality-test/PersonalityTestHistory';
import type { TestConfigDTO, PersonalityTestHistoryDTO, RawResponse, DemographicData } from '@/types/personalityTest';

interface Props {
	config: TestConfigDTO;
	history: PersonalityTestHistoryDTO[];
}

export default function PersonalityTestClient({ config, history }: Props) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = useCallback(
		async (demographics: DemographicData, responses: RawResponse[], durationSeconds: number) => {
			setIsSubmitting(true);
			setError(null);

			try {
				const res = await fetch('/api/personality-test', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ demographics, responses, durationSeconds }),
				});

				const json = await res.json();

				if (!json.ok) {
					setError(json.error || 'Đã xảy ra lỗi khi gửi bài test');
					setIsSubmitting(false);
					return;
				}

				// Redirect to results page
				router.push(`/personality-test/results/${json.data.id}`);
			} catch {
				setError('Lỗi kết nối. Vui lòng thử lại.');
				setIsSubmitting(false);
			}
		},
		[router]
	);

	return (
		<div className="space-y-8">
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

			{/* Test History */}
			<PersonalityTestHistory history={history} />
		</div>
	);
}
