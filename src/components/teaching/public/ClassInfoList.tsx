'use client';

import { useState, type ReactNode } from 'react';

import { Sheet } from '@/components/ui/Dialog';
import { getCpPolicyText, type PublicClassBoard } from '@/features/teaching/types';

import { isRepeatedClassSummary } from './studentIdentity';

type InfoItemId = 'intro' | 'rules' | 'links';

interface InfoItem {
	id: InfoItemId;
	label: string;
	content: ReactNode;
}

export function ClassInfoList({ board }: { board: PublicClassBoard }) {
	const [openSheet, setOpenSheet] = useState<InfoItemId | null>(null);
	const classRules = board.rules.trim();
	const commonRules = getCpPolicyText(board.policy);
	const summary = board.summary.trim();
	const repeatedSummary = isRepeatedClassSummary(summary, board);
	const visibleSummary = repeatedSummary ? '' : summary;
	const description = board.description.trim();

	const items: InfoItem[] = [];

	if (visibleSummary || description) {
		items.push({
			id: 'intro',
			label: 'Giới thiệu lớp',
			content: (
				<div className="space-y-3 text-sm leading-6 text-ink-secondary">
					{visibleSummary ? <p className="font-medium text-ink">{visibleSummary}</p> : null}
					{description ? <p className="whitespace-pre-wrap break-words">{description}</p> : null}
				</div>
			),
		});
	}

	items.push({
		id: 'rules',
		label: 'Quy định lớp',
		content: (
			<div className="space-y-4 text-sm leading-6 text-ink-secondary">
				<div>
					<p className="mb-1 font-semibold text-ink">Quy định chung</p>
					<ul className="space-y-1.5">
						{commonRules.map((rule) => (
							<li key={rule}>• {rule}</li>
						))}
					</ul>
				</div>
				{classRules ? (
					<div>
						<p className="mb-1 font-semibold text-ink">Nội quy lớp</p>
						<p className="whitespace-pre-wrap break-words">{classRules}</p>
					</div>
				) : null}
			</div>
		),
	});

	if (board.links.length > 0) {
		items.push({
			id: 'links',
			label: `Tài liệu lớp (${board.links.length})`,
			content: (
				<ul className="space-y-2">
					{board.links.map((link) => (
						<li key={link.id} className="min-w-0">
							<a
								href={link.url}
								target="_blank"
								rel="noopener noreferrer"
								className="block min-h-11 break-words rounded-[var(--mc-r-sm)] border border-mc-rule px-3 py-2 text-sm text-ink hover:border-accent"
							>
								<strong className="font-semibold text-accent">{link.label} ↗</strong>
								{link.description ? (
									<span className="mt-1 block text-xs leading-5 text-ink-secondary">
										{link.description}
									</span>
								) : null}
							</a>
						</li>
					))}
				</ul>
			),
		});
	}

	const activeSheetItem = items.find((item) => item.id === openSheet) ?? null;

	return (
		<section className="teaching-public-section" aria-label="Thông tin lớp">
			<div className="teaching-public-section-head">
				<h2>Thông tin lớp</h2>
			</div>

			{/* Desktop: expand in place */}
			<div className="hidden md:block">
				{items.map((item) => (
					<details key={item.id} className="group border-b border-mc-rule">
						<summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-ink hover:text-accent">
							<span>{item.label}</span>
							<span
								aria-hidden="true"
								className="text-ink-secondary transition-transform group-open:rotate-180"
							>
								⌄
							</span>
						</summary>
						<div className="pb-4">{item.content}</div>
					</details>
				))}
			</div>

			{/* Mobile: open in bottom sheet */}
			<div className="md:hidden">
				{items.map((item) => (
					<button
						key={item.id}
						type="button"
						className="teaching-public-row text-sm font-semibold"
						onClick={() => setOpenSheet(item.id)}
					>
						<span>{item.label}</span>
						<span aria-hidden="true" className="text-ink-secondary">
							›
						</span>
					</button>
				))}
			</div>

			<Sheet
				open={activeSheetItem !== null}
				onClose={() => setOpenSheet(null)}
				title={activeSheetItem?.label ?? ''}
				side="bottom"
			>
				{activeSheetItem?.content}
			</Sheet>
		</section>
	);
}
