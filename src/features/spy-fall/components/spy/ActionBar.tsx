'use client';

import { createContext, useContext } from 'react';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { cn } from '@/features/spy-fall/lib/cn';
import GameIcon from '@/features/spy-fall/components/ui/GameIcon';

/** Opens the "my word" sheet; null when there is no word to show in this phase. */
export const WordPeekContext = createContext<(() => void) | null>(null);

/** Host-only tools, rendered just above the bar so they never sit below it. */
export const HostToolsContext = createContext<React.ReactNode>(null);

interface Props {
	children?: React.ReactNode;
	className?: string;
}

/**
 * Thumb-reach bar pinned to the bottom of the screen. Holds the phase's main action
 * and, once words are dealt, a button to peek at your own word again.
 */
export default function ActionBar({ children, className }: Props) {
	const t = useT();
	const openWord = useContext(WordPeekContext);
	const hostTools = useContext(HostToolsContext);

	return (
		<>
			<div className="mt-auto pt-6">{hostTools}</div>
			<div
				className={cn(
					'sticky bottom-0 z-30 -mx-4 mt-3 border-t border-border bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-background/80',
					className,
				)}
			>
				<div className="flex items-center gap-2">
					{openWord ? (
						<button
							type="button"
							onClick={openWord}
							className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-xl hover:bg-surface-hover"
							aria-label={t('spy.actions.myWord')}
							title={t('spy.actions.myWord')}
						>
							<GameIcon name="passport" size={21} />
						</button>
					) : null}
					<div className="min-w-0 flex-1">{children}</div>
				</div>
			</div>
		</>
	);
}

export function ActionBarNote({ children }: { children: React.ReactNode }) {
	return <p className="py-3 text-center text-sm text-muted-foreground">{children}</p>;
}
