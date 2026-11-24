'use client';

import { useState } from 'react';

import { Sheet } from '@/components/ui/Dialog';
import { getCpPolicyText, type PublicClassBoard } from '@/features/teaching/types';

import { StudentClassIntro } from './StudentClassIntro';
import { isRepeatedClassSummary } from './studentIdentity';

export function ClassInfoList({ board }: { board: PublicClassBoard }) {
	const [rulesOpen, setRulesOpen] = useState(false);
	const classRules = board.rules.trim();
	const commonRules = getCpPolicyText(board.policy);
	const summary = board.summary.trim();
	const repeatedSummary = isRepeatedClassSummary(summary, board);
	const description = board.description.trim();
	const announcement = board.announcement.trim();

	return (
		<>
			<StudentClassIntro
				summary={repeatedSummary ? '' : summary}
				description={description}
				announcement={announcement}
				links={board.links}
			/>

			<details className="mc-surface hidden md:block">
				<summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-ink">
					Quy định lớp
				</summary>
				<div className="space-y-4 border-t border-mc-rule px-5 py-4 text-xs leading-5 text-ink-secondary">
					<div>
						<p className="mb-1 font-semibold text-ink">Quy định chung</p>
						<ul className="space-y-1">
							{commonRules.map((rule) => (
								<li key={rule}>• {rule}</li>
							))}
						</ul>
					</div>
					{classRules ? (
						<div>
							<p className="mb-1 font-semibold text-ink">Nội quy lớp</p>
							<p className="whitespace-pre-wrap">{classRules}</p>
						</div>
					) : null}
				</div>
			</details>
			<button
				type="button"
				className="mc-surface flex min-h-11 w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-ink md:hidden"
				onClick={() => setRulesOpen(true)}
			>
				<span>Quy định lớp</span>
				<span aria-hidden>⌄</span>
			</button>
			<Sheet
				open={rulesOpen}
				onClose={() => setRulesOpen(false)}
				title="Quy định lớp"
				side="bottom"
			>
				<div className="space-y-4 text-sm leading-6 text-ink-secondary">
					<div>
						<p className="mb-1 font-semibold text-ink">Quy định chung</p>
						<ul className="space-y-2">
							{commonRules.map((rule) => (
								<li key={rule}>• {rule}</li>
							))}
						</ul>
					</div>
					{classRules ? (
						<div>
							<p className="mb-1 font-semibold text-ink">Nội quy lớp</p>
							<p className="whitespace-pre-wrap">{classRules}</p>
						</div>
					) : null}
				</div>
			</Sheet>
		</>
	);
}
