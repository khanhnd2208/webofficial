'use client';

import { useState } from 'react';

import {
	CHEESE_MAX_PLAYERS,
	CHEESE_MIN_PLAYERS,
	type FollowerSettings,
} from '@/features/cheese-thief/config/cheeseThief';
import {
	allTableSizes,
	tableRulesFor,
	type FollowerKnowledge,
	type TableRules,
} from '@/features/cheese-thief/lib/tableRules';
import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { Sheet } from '@/features/board-game-shared/components/ui';
import { cn } from '@/features/board-game-shared/lib/cn';

type TranslateFn = ReturnType<typeof useT>;

interface TableProps {
	playerCount?: number;
	scapegoatEnabled?: boolean;
	followers?: FollowerSettings;
}

const PLAY: { id: string; bullets: number }[] = [
	{ id: 'setup', bullets: 3 },
	{ id: 'night', bullets: 4 },
	{ id: 'secret', bullets: 3 },
	{ id: 'talk', bullets: 4 },
];

const KNOW_KEYS: Record<FollowerKnowledge, string> = {
	none: 'knowNone',
	blind: 'knowBlind',
	pair: 'knowPair',
	'followers-only': 'knowFollowersOnly',
	all: 'knowAll',
};

/** Plain-language rules for one table size, built from the same preset the game deals with. */
function followerLineKey(count: number, customized: boolean): string {
	if (count === 1) return customized ? 'followerCustomOne' : 'followerOne';
	return customized ? 'followerCustom' : 'follower';
}

export function tableRuleLines(
	t: TranslateFn,
	rules: TableRules,
	scapegoatEnabled: boolean,
): string[] {
	const lines = [t('cheese.guide.table.one')];
	lines.push(t(rules.peek ? 'cheese.guide.table.peek' : 'cheese.guide.table.noPeek'));
	if (rules.followerMode === 'none') {
		lines.push(t('cheese.guide.table.noFollower'));
	} else {
		const know = t(`cheese.guide.table.know.${rules.knowledge}`);
		const customized =
			rules.followerCustomized && rules.followerCount !== rules.defaultFollowerCount;
		const followerKey = followerLineKey(rules.followerCount, customized);
		lines.push(
			t(`cheese.guide.table.${followerKey}`, {
				count: rules.followerCount,
				know,
				default: rules.defaultFollowerCount,
			}),
		);
	}
	lines.push(t('cheese.guide.table.picks', { count: rules.choiceCount }));
	if (rules.scapegoatAllowed) {
		lines.push(
			t(scapegoatEnabled ? 'cheese.guide.table.scapegoatOn' : 'cheese.guide.table.scapegoatOff'),
		);
	} else if (scapegoatEnabled) {
		lines.push(t('cheese.guide.table.scapegoatTooSmall'));
	}
	return lines;
}

export function TableRulesCard({
	playerCount,
	scapegoatEnabled = false,
	followers,
	className,
}: TableProps & { className?: string }) {
	const t = useT();
	if (playerCount === undefined) return null;
	const rules = tableRulesFor(playerCount, followers);

	return (
		<section className={cn('rounded-2xl border border-border bg-surface px-4 py-3', className)}>
			<div className="flex items-baseline justify-between gap-3">
				<h3 className="font-mono text-[0.68rem] tracking-[0.16em] text-muted uppercase">
					{t('cheese.guide.yourTable')}
				</h3>
				<span className="text-xs text-muted">
					{t('cheese.guide.yourTableMeta', { count: playerCount })}
				</span>
			</div>
			{rules ? (
				<ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
					{tableRuleLines(t, rules, scapegoatEnabled).map((line) => (
						<li key={line}>{line}</li>
					))}
				</ul>
			) : (
				<p className="mt-2 text-sm leading-relaxed text-muted">
					{t('cheese.guide.notAllowed', {
						min: CHEESE_MIN_PLAYERS,
						max: CHEESE_MAX_PLAYERS,
						count: playerCount,
					})}
				</p>
			)}
		</section>
	);
}

function TableOverview({ playerCount }: { playerCount?: number }) {
	const t = useT();
	const rows = allTableSizes();

	return (
		<section>
			<div className="overflow-x-auto">
				<table className="w-full text-left text-sm">
					<thead className="font-mono text-[0.62rem] tracking-[0.12em] text-muted uppercase">
						<tr>
							<th className="py-2 pr-2 font-normal">{t('cheese.guide.overview.colPlayers')}</th>
							<th className="py-2 pr-2 font-normal">{t('cheese.guide.overview.colFollowers')}</th>
							<th className="py-2 pr-2 font-normal">{t('cheese.guide.overview.maxFollowers')}</th>
							<th className="py-2 font-normal">{t('cheese.guide.overview.colKnow')}</th>
						</tr>
					</thead>
					<tbody>
						{rows.map(({ playerCount: count, rules }) => (
							<tr
								key={count}
								className={cn(
									'border-t border-border align-top',
									count === playerCount && 'bg-foreground/5 font-medium',
								)}
							>
								<td className="py-2 pr-2 tabular-nums">{count}</td>
								<td className="py-2 pr-2">
									{rules.followerCount === 0
										? t('cheese.guide.overview.followersNone')
										: t('cheese.guide.overview.followersPick', { count: rules.followerCount })}
								</td>
								<td className="py-2 pr-2 tabular-nums">{rules.maxFollowers}</td>
								<td className="py-2">{t(`cheese.guide.overview.${KNOW_KEYS[rules.knowledge]}`)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<p className="mt-2 text-xs leading-relaxed text-muted">{t('cheese.guide.overview.note4')}</p>
		</section>
	);
}

function GuideSection({
	id,
	bullets,
	showTitle = true,
}: {
	id: string;
	bullets: number;
	showTitle?: boolean;
}) {
	const t = useT();
	return (
		<section>
			{showTitle && (
				<h3 className="font-display text-lg font-medium">
					{t(`cheese.guide.sections.${id}.title`)}
				</h3>
			)}
			<ul
				className={cn(
					'list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/85',
					showTitle && 'mt-2',
				)}
			>
				{Array.from({ length: bullets }, (_, index) => (
					<li key={index}>{t(`cheese.guide.sections.${id}.b${index + 1}`)}</li>
				))}
			</ul>
		</section>
	);
}

function QuickStart() {
	const t = useT();
	return (
		<section className="rounded-2xl border border-border bg-surface px-4 py-4">
			<h3 className="font-display text-lg font-medium">{t('cheese.guide.quick.title')}</h3>
			<ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground/85">
				{[1, 2, 3, 4].map((number) => (
					<li key={number}>{t(`cheese.guide.quick.b${number}`)}</li>
				))}
			</ol>
		</section>
	);
}

export default function CheeseRulesGuide({ playerCount, scapegoatEnabled, followers }: TableProps) {
	const t = useT();
	const scapegoatOpen = Boolean(scapegoatEnabled) && (playerCount ?? 0) >= 6;
	return (
		<div className="space-y-6">
			<p className="text-sm leading-relaxed text-muted">{t('cheese.guide.intro')}</p>
			<QuickStart />
			<GuideSection id="roles" bullets={3} />
			<TableRulesCard
				playerCount={playerCount}
				scapegoatEnabled={scapegoatEnabled}
				followers={followers}
			/>
			{PLAY.map((section) => (
				<GuideSection key={section.id} id={section.id} bullets={section.bullets} />
			))}
			<GuideSection id="win" bullets={3} />
			{scapegoatOpen ? (
				<GuideSection id="scapegoat" bullets={3} />
			) : (
				<details className="rounded-2xl border border-border px-4 py-3">
					<summary className="cursor-pointer font-display text-lg font-medium">
						{t('cheese.guide.sections.scapegoat.title')}
					</summary>
					<div className="mt-4">
						<GuideSection id="scapegoat" bullets={3} showTitle={false} />
					</div>
				</details>
			)}
			<details className="rounded-2xl border border-border px-4 py-3">
				<summary className="cursor-pointer font-display text-lg font-medium">
					{t('cheese.guide.overview.title')}
				</summary>
				<div className="mt-4">
					<TableOverview playerCount={playerCount} />
				</div>
			</details>
			<details className="rounded-2xl border border-border px-4 py-3">
				<summary className="cursor-pointer font-display text-lg font-medium">
					{t('cheese.guide.sections.houseRules.title')}
				</summary>
				<div className="mt-4">
					<GuideSection id="houseRules" bullets={4} showTitle={false} />
				</div>
			</details>
		</div>
	);
}

/** A "How to play" link that opens the full guide in a sheet, from the menu, the lobby, or mid-round. */
export function CheeseRulesButton({ className, ...table }: TableProps & { className?: string }) {
	const t = useT();
	const [open, setOpen] = useState(false);
	return (
		<>
			<button type="button" className={className} onClick={() => setOpen(true)}>
				{t('cheese.guide.open')}
			</button>
			<Sheet open={open} onClose={() => setOpen(false)} title={t('cheese.guide.title')}>
				<CheeseRulesGuide {...table} />
			</Sheet>
		</>
	);
}
