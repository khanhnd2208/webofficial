'use client';

import type { RefObject } from 'react';
import {
	READING_LEVEL_HINT,
	READING_LEVEL_LABEL,
	type ReadingLevel,
} from '@/features/my-class/domain/readingLevel';
import type { ReaderHeading } from '@/features/my-class/domain/readerHtml';
import type { MyClassOutlineItem } from '@/features/my-class/domain/learnerState';
import { formatDuration } from '@/features/my-class/domain/estimateReading';
import { McButton, McSegmented, McSkeleton } from '@/components/myclass/ui';
import ReaderFooterNav from './ReaderFooterNav';

export type ReaderLevelBlock = {
	level: ReadingLevel;
	html: string;
	headings: ReaderHeading[];
};

export type ReaderPosition = {
	lessonNumber: string;
	lessonTitle: string;
	sectionTitle: string;
	indexInSection: number;
	sectionTotal: number;
};

export default function Reader({
	selected,
	headingRef,
	loading,
	switching,
	loadError,
	onRetry,
	blocks,
	activeLevel,
	onSelectLevel,
	onComplete,
	completeBusy,
	nextTitle,
	estimatedMinutes,
	desktop,
	contentKey,
	position,
}: {
	selected: MyClassOutlineItem;
	headingRef: RefObject<HTMLHeadingElement | null>;
	loading: boolean;
	switching?: boolean;
	loadError: string | null;
	onRetry: () => void;
	blocks: ReaderLevelBlock[];
	activeLevel: ReadingLevel | null;
	onSelectLevel: (level: ReadingLevel) => void;
	onComplete: () => void;
	completeBusy?: boolean;
	nextTitle: string | null;
	estimatedMinutes?: number | null;
	desktop: boolean;
	contentKey: string;
	position: ReaderPosition | null;
}) {
	const multi = blocks.length > 1;
	const activeBlock = blocks.find((block) => block.level === activeLevel) ?? blocks[0] ?? null;
	const resolvedLevel = activeBlock?.level ?? activeLevel;

	return (
		<div
			data-testid="my-class-reader"
			data-desktop={desktop ? 'true' : undefined}
			className="relative min-h-[60vh] pb-20 lg:pb-8"
		>
			{switching ? (
				<div className="mc-switch-bar" aria-hidden>
					<span />
				</div>
			) : null}
			<header className="mb-6">
				{position ? (
					<p className="mc-eyebrow text-[11px] lg:text-xs">
						Bài {position.lessonNumber} • {position.lessonTitle}
					</p>
				) : null}
				{position ? (
					<p className="mc-eyebrow mt-1 text-[11px] lg:mt-4 lg:text-xs">
						{position.sectionTitle}
						{position.sectionTotal > 0 ? (
							<>
								{' '}
								•{' '}
								<span className="mc-num">
									{String(position.indexInSection).padStart(2, '0')}/
									{String(position.sectionTotal).padStart(2, '0')}
								</span>
							</>
						) : null}
					</p>
				) : null}
				<h1
					ref={headingRef}
					tabIndex={-1}
					className={`mc-reader-title mc-title scroll-mt-28 outline-none ${position ? 'mt-4' : 'mt-6'}`}
				>
					{selected.title}
				</h1>
				{selected.summary ? <p className="mc-dek mt-4">{selected.summary}</p> : null}
				{estimatedMinutes != null ? (
					<p className="mc-meta mt-2 xl:hidden">{formatDuration(estimatedMinutes)}</p>
				) : null}
				{blocks.length && activeBlock && multi ? (
					<div className="mt-8">
						<div className="-mx-5 min-w-0 overflow-x-auto px-5 lg:mx-0 lg:px-0">
							<McSegmented
								label="Mức độ đọc"
								value={resolvedLevel ?? activeBlock.level}
								onChange={onSelectLevel}
								options={blocks.map((block) => ({
									value: block.level,
									label: READING_LEVEL_LABEL[block.level],
									hint: READING_LEVEL_HINT[block.level],
								}))}
								className="whitespace-nowrap"
							/>
						</div>
						{resolvedLevel ? (
							<p className="mc-eyebrow mt-4">{READING_LEVEL_HINT[resolvedLevel]}</p>
						) : null}
					</div>
				) : null}
			</header>

			<div className="mb-8 h-px w-full bg-mc-rule/40" />

			{loading && !blocks.length ? (
				<div className="space-y-3" aria-busy="true">
					<McSkeleton className="h-5 w-2/3" />
					<McSkeleton className="h-4 w-full" />
					<McSkeleton className="h-4 w-11/12" />
					<McSkeleton className="h-4 w-4/5" />
				</div>
			) : loadError && !blocks.length ? (
				<div className="border border-dashed border-mc-rule p-6">
					<p className="mc-meta">{loadError}</p>
					<McButton variant="secondary" className="mt-4" onClick={onRetry}>
						Thử lại
					</McButton>
				</div>
			) : blocks.length && activeBlock ? (
				<div key={contentKey}>
					<div
						className="mc-prose mc-reader-fade"
						dangerouslySetInnerHTML={{ __html: activeBlock.html }}
					/>
				</div>
			) : (
				<p className="mc-meta">Nội dung chưa sẵn sàng.</p>
			)}

			<div className="mt-16 hidden lg:block">
				<ReaderFooterNav
					done={selected.status === 'done'}
					nextTitle={nextTitle}
					onComplete={onComplete}
					disabled={loading || Boolean(loadError)}
					loading={completeBusy}
				/>
			</div>
		</div>
	);
}
