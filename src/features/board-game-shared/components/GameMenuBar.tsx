'use client';

import Link from 'next/link';

import SiteAuthChip from '@/components/site/SiteAuthChip';
import PrefsToggleGroup from '@/features/board-game-shared/components/i18n/PrefsToggleGroup';
import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import GameIcon from '@/features/board-game-shared/components/ui/GameIcon';
import { routes } from '@/config/routes';

/**
 * Top bar of each game's menu: back to the Board Game hub, language/theme, who is signed in
 * (with the admin badge), and the bot test room for admins.
 */
export default function GameMenuBar({
	backLabel,
	testGame,
	isAdmin,
}: {
	backLabel: string;
	testGame: 'spy-fall' | 'ma-soi' | 'cheese-thief';
	isAdmin: boolean;
}) {
	const t = useT();
	return (
		<div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
			<Link
				href={routes.boardGame}
				className="inline-flex min-h-10 items-center gap-2 text-xs tracking-[0.16em] text-muted uppercase transition hover:text-foreground"
			>
				<GameIcon name="arrow-left" size={15} />
				{backLabel}
			</Link>
			<div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
				<PrefsToggleGroup />
				{isAdmin ? (
					<Link
						href={`${routes.boardGameTest}?game=${testGame}`}
						className="rounded-full border border-vermilion/40 px-3 py-2 text-xs text-ink"
					>
						{t('testRoom.title')}
					</Link>
				) : null}
				<SiteAuthChip variant="bar" className="text-xs text-foreground" />
			</div>
		</div>
	);
}
