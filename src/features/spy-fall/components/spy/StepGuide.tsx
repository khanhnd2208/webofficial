'use client';

import { startTransition, useEffect, useState } from 'react';

import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { cn } from '@/features/board-game-shared/lib/cn';
import type { MessageParams } from '@/features/board-game-shared/lib/i18n/types';

const STORAGE_KEY = 'spy-fall-steps-hidden';

function readHidden(): boolean {
	try {
		return localStorage.getItem(STORAGE_KEY) === '1';
	} catch {
		return false;
	}
}

function writeHidden(hidden: boolean): void {
	try {
		localStorage.setItem(STORAGE_KEY, hidden ? '1' : '0');
	} catch {
		// Private mode or blocked storage: the toggle still works for this visit.
	}
}

interface Props {
	/** i18n key whose value is the steps, one per line. */
	stepsKey: string;
	params?: MessageParams;
	/** Optional extra line shown under the steps. */
	tipKey?: string;
	className?: string;
}

/** "What now?" card: numbered steps for the current phase. Collapsing is remembered across rounds. */
export default function StepGuide({ stepsKey, params, tipKey, className }: Props) {
	const t = useT();
	const [hidden, setHidden] = useState(false);

	useEffect(() => {
		startTransition(() => setHidden(readHidden()));
	}, []);

	function toggle() {
		setHidden((prev) => {
			writeHidden(!prev);
			return !prev;
		});
	}

	const steps = t(stepsKey, params).split('\n').filter(Boolean);

	if (hidden) {
		return (
			<button
				type="button"
				onClick={toggle}
				className={cn(
					'text-xs font-medium text-accent underline-offset-2 hover:underline',
					className,
				)}
			>
				{t('spy.steps.show')}
			</button>
		);
	}

	return (
		<section
			className={cn('rounded-2xl border border-accent/25 bg-accent-subtle/60 px-4 py-3', className)}
			aria-label={t('spy.steps.heading')}
		>
			<div className="flex items-center justify-between gap-3">
				<h2 className="text-xs font-bold uppercase tracking-wider text-accent">
					{t('spy.steps.heading')}
				</h2>
				<button
					type="button"
					onClick={toggle}
					className="-mr-2 min-h-9 rounded-lg px-2 text-xs text-muted hover:bg-surface-hover"
				>
					{t('spy.steps.hide')}
				</button>
			</div>
			<ol className="mt-1 space-y-1.5">
				{steps.map((step, i) => (
					<li key={step} className="flex gap-2.5 text-sm leading-snug text-foreground">
						{steps.length > 1 ? (
							<span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
								{i + 1}
							</span>
						) : null}
						<span>{step}</span>
					</li>
				))}
			</ol>
			{tipKey ? <p className="mt-2 text-xs text-muted-foreground">{t(tipKey, params)}</p> : null}
		</section>
	);
}
