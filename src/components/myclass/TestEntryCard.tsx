import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

import { routes } from '@/config/routes';
import type { MyClassTestListItem } from '@/features/my-class';
import type { StoredTestScore } from '@/features/my-class/client/testScoreStore';
import { McIcon } from '@/components/myclass/ui';
import StatusChip from '@/components/myclass/workspace/edit/StatusChip';

export default function TestEntryCard({
	courseSlug,
	test,
	score,
	onOpen,
	density = 'default',
	depth = 1,
	trailing,
}: {
	courseSlug: string;
	test: MyClassTestListItem;
	score?: StoredTestScore | null;
	onOpen?: (test: MyClassTestListItem) => void;
	density?: 'default' | 'compact';
	depth?: number;
	trailing?: ReactNode;
}) {
	const done = Boolean(score);
	const draft = Boolean(test.authoring && test.authoring.status !== 'PUBLISHED');
	const meta = done
		? `${test.questionCount} câu · ${score!.score}/${score!.total}`
		: `${test.questionCount} câu`;
	const compactMeta = done ? `${score!.score}/${score!.total}` : `${test.questionCount} câu`;
	const cta = done ? 'Xem lại' : 'Làm bài';
	const draftLabel = draft ? ', bản nháp' : '';
	const label = test.title.trim() || 'Bài kiểm tra';
	const ariaLabel =
		density === 'compact'
			? `${label}, ${meta}${draftLabel}. ${cta}`
			: `${label}, ${meta}${draftLabel}`;

	if (density === 'compact') {
		const compactClass = trailing
			? 'mc-focus-ring touch-manipulation flex min-h-[var(--mc-out-row)] min-w-0 flex-1 items-center gap-2 self-stretch bg-transparent py-0 text-left'
			: 'mc-outline-row mc-focus-ring touch-manipulation';
		const draftAttr = draft ? 'true' : undefined;
		const inner = (
			<>
				<span className="mc-outline-slot text-accent" aria-hidden>
					<McIcon name="assignment" size={16} />
				</span>
				<span className="min-w-0 flex-1 truncate text-[14px] font-semibold leading-5 text-ink-secondary">
					{label}
				</span>
				{draft ? (
					<StatusChip status={test.authoring?.status} hasDraft={test.authoring?.hasDraft} />
				) : null}
				<span className="mc-num shrink-0 text-[12px] text-ink-secondary">{compactMeta}</span>
			</>
		);
		const style = { '--depth': depth } as CSSProperties;
		const control = onOpen ? (
			<button
				type="button"
				onClick={() => onOpen(test)}
				className={compactClass}
				style={trailing ? undefined : style}
				aria-label={ariaLabel}
				data-outline-row=""
				data-kind="test"
				data-draft={draftAttr}
			>
				{inner}
			</button>
		) : (
			<Link
				href={routes.myClassTest(courseSlug, test.slug)}
				className={compactClass}
				style={trailing ? undefined : style}
				aria-label={ariaLabel}
				data-outline-row=""
				data-kind="test"
				data-draft={draftAttr}
			>
				{inner}
			</Link>
		);
		if (!trailing) return control;
		return (
			<div
				className="mc-outline-row"
				data-kind="test"
				data-draft={draft ? 'true' : undefined}
				style={style}
			>
				{control}
				{trailing}
			</div>
		);
	}

	const className = 'group mc-test-widget mc-focus-ring block w-full p-4 text-left';

	const inner = (
		<>
			<div className="mb-2 flex items-start justify-between">
				<div className="flex items-center gap-2">
					<span className="rounded-[var(--mc-r-xs)] bg-accent/10 px-2 py-0.5 text-[12px] font-bold leading-4 text-accent">
						TEST
					</span>
					<h4 className="text-[14px] font-semibold leading-5 text-ink transition-colors group-hover:text-accent">
						{label}
					</h4>
				</div>
			</div>
			<div className="flex items-center justify-between text-[12px] leading-4 text-ink-secondary">
				<span>{meta}</span>
				<span className="inline-flex items-center gap-1 font-medium transition-transform group-hover:translate-x-1">
					{cta} <McIcon name="arrow_forward" size={14} />
				</span>
			</div>
		</>
	);

	if (onOpen) {
		return (
			<button
				type="button"
				onClick={() => onOpen(test)}
				className={className}
				aria-label={ariaLabel}
			>
				{inner}
			</button>
		);
	}

	return (
		<Link
			href={routes.myClassTest(courseSlug, test.slug)}
			className={className}
			aria-label={ariaLabel}
		>
			{inner}
		</Link>
	);
}
