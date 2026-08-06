'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import PrefsToggleGroup from '@/components/i18n/PrefsToggleGroup';
import { useT } from '@/components/i18n/LocaleProvider';
import { Badge, Button, Card } from '@/components/ui';
import {
	BOARD_GAMES,
	FEATURE_TABS,
	KSTRIP_NAME,
	type BoardGameItem,
	type FeatureTabId,
} from '@/config/kstripFeatures';

const ACCENT_STYLES: Record<BoardGameItem['accent'], { ring: string; badge: string; glow: string }> = {
	accent: {
		ring: 'group-hover:border-accent',
		badge: 'bg-accent-subtle text-accent',
		glow: 'group-hover:shadow-[0_8px_30px_-8px_rgba(196,75,40,0.35)]',
	},
	indigo: {
		ring: 'group-hover:border-indigo',
		badge: 'bg-indigo-subtle text-indigo',
		glow: 'group-hover:shadow-[0_8px_30px_-8px_rgba(91,127,181,0.35)]',
	},
	teal: {
		ring: 'group-hover:border-teal',
		badge: 'bg-teal-subtle text-teal',
		glow: 'group-hover:shadow-[0_8px_30px_-8px_rgba(74,158,143,0.35)]',
	},
	purple: {
		ring: 'group-hover:border-purple',
		badge: 'bg-purple-subtle text-purple',
		glow: 'group-hover:shadow-[0_8px_30px_-8px_rgba(139,111,176,0.35)]',
	},
	rose: {
		ring: 'group-hover:border-rose',
		badge: 'bg-rose-subtle text-rose',
		glow: 'group-hover:shadow-[0_8px_30px_-8px_rgba(196,100,120,0.35)]',
	},
};

function isFeatureTabId(value: string | null): value is FeatureTabId {
	return FEATURE_TABS.some((tab) => tab.id === value);
}

function GameCard({ game }: { game: BoardGameItem }) {
	const t = useT();
	const styles = ACCENT_STYLES[game.accent];
	const title = t(`hub.games.${game.slug}.title`);
	const subtitle = t(`hub.games.${game.slug}.subtitle`);
	const description = t(`hub.games.${game.slug}.description`);
	const players = t(`hub.games.${game.slug}.players`);
	const duration = t(`hub.games.${game.slug}.duration`);

	if (!game.available) {
		return (
			<article
				className="relative overflow-hidden rounded-2xl border border-dashed border-border bg-surface/60 p-5 opacity-80"
				aria-disabled
			>
				<div className="flex items-start gap-4">
					<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-secondary text-3xl">
						{game.emoji}
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-2">
							<h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
							<Badge variant="muted">{t('common.comingSoon')}</Badge>
						</div>
						<p className="mt-0.5 text-sm text-muted">{subtitle}</p>
						<p className="mt-2 text-sm text-muted-foreground">{description}</p>
						<div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
							<span className="rounded-full border border-border px-2.5 py-1">{players}</span>
							<span className="rounded-full border border-border px-2.5 py-1">{duration}</span>
						</div>
					</div>
				</div>
			</article>
		);
	}

	return (
		<Link
			href={game.href}
			className={`group relative block overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 ${styles.ring} ${styles.glow}`}
		>
			<div className="flex items-start gap-4">
				<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-secondary text-3xl transition group-hover:scale-105">
					{game.emoji}
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="font-display text-lg font-semibold text-foreground transition group-hover:text-accent">
							{title}
						</h3>
						<span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles.badge}`}>
							{t('hub.startMission')}
						</span>
					</div>
					<p className="mt-0.5 text-sm text-muted">{subtitle}</p>
					<p className="mt-2 text-sm text-muted-foreground">{description}</p>
					<div className="mt-3 flex flex-wrap gap-2 text-xs">
						<span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
							{players}
						</span>
						<span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
							{duration}
						</span>
					</div>
				</div>
			</div>
		</Link>
	);
}

function ComingSoonPanel({ tabId, icon }: { tabId: FeatureTabId; icon: string }) {
	const t = useT();
	const [notified, setNotified] = useState(false);

	return (
		<div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
			<div className="text-5xl" aria-hidden>
				{icon}
			</div>
			<h2 className="font-display mt-4 text-xl font-semibold text-ink">
				{t(`hub.tabs.${tabId}.label`)}
			</h2>
			<p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
				{t(`hub.tabs.${tabId}.description`)}
			</p>
			<p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
				{t('hub.unavailable.preparing')}
			</p>
			<Button
				variant="secondary"
				size="md"
				className="mt-6"
				onClick={() => setNotified(true)}
				disabled={notified}
			>
				{notified ? t('hub.unavailable.notified') : t('hub.unavailable.notifyMe')}
			</Button>
		</div>
	);
}

function BoardgamesPanel() {
	const t = useT();
	const activeGames = BOARD_GAMES.filter((g) => g.available);
	const upcomingGames = BOARD_GAMES.filter((g) => !g.available);

	return (
		<div className="space-y-8">
			<div>
				<h2 className="font-display text-xl font-semibold text-ink">{t('hub.boardgames.pick')}</h2>
				<p className="mt-1 text-sm text-muted-foreground">{t('hub.boardgames.pickHint')}</p>
			</div>

			<div className="grid gap-4">
				{activeGames.map((game) => (
					<GameCard key={game.slug} game={game} />
				))}
			</div>

			{upcomingGames.length > 0 && (
				<div>
					<h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
						{t('hub.boardgames.upcoming')}
					</h3>
					<div className="grid gap-4 sm:grid-cols-2">
						{upcomingGames.map((game) => (
							<GameCard key={game.slug} game={game} />
						))}
					</div>
				</div>
			)}
		</div>
	);
}

export default function KstripHub() {
	const t = useT();
	const searchParams = useSearchParams();
	const initialTab = useMemo(() => {
		const fromUrl = searchParams.get('tab');
		if (isFeatureTabId(fromUrl) && FEATURE_TABS.find((tab) => tab.id === fromUrl)?.available) {
			return fromUrl;
		}
		return 'boardgames' satisfies FeatureTabId;
	}, [searchParams]);

	const [activeTab, setActiveTab] = useState<FeatureTabId>(initialTab);

	const selectTab = useCallback((id: FeatureTabId) => {
		const tab = FEATURE_TABS.find((item) => item.id === id);
		if (!tab?.available) return;
		setActiveTab(id);
		const url = new URL(window.location.href);
		url.searchParams.set('tab', id);
		window.history.replaceState(null, '', url);
	}, []);

	const currentTab = FEATURE_TABS.find((tab) => tab.id === activeTab)!;

	return (
		<div className="min-h-screen bg-background">
			<div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(196,75,40,0.08),transparent_70%)]" />

			<div className="relative mx-auto max-w-3xl px-4 pb-16 pt-10 sm:pt-14">
				<div className="mb-6 flex justify-end">
					<PrefsToggleGroup />
				</div>

				<header className="text-center">
					<p className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-muted">
						{t('hub.hero.eyebrow')}
					</p>
					<h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
						{KSTRIP_NAME}
					</h1>
					<p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
						{t('hub.hero.tagline')}
					</p>
				</header>

				<Card elevated className="mx-auto mt-8 max-w-md border-dashed ticket-notch text-left text-sm">
					<p className="font-mono text-[10px] uppercase tracking-widest text-muted">
						{t('hub.hero.boarding')}
					</p>
					<p className="font-display mt-1 font-semibold text-ink">{t('hub.hero.expedition')}</p>
					<p className="mt-1 text-muted-foreground">{t('hub.hero.expeditionHint')}</p>
				</Card>

				<nav
					className="mt-10 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
					aria-label="K'sTrip features"
				>
					{FEATURE_TABS.map((tab) => {
						const isActive = tab.id === activeTab;
						const isDisabled = !tab.available;

						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => selectTab(tab.id)}
								disabled={isDisabled}
								aria-current={isActive ? 'page' : undefined}
								className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
									isActive
										? 'border-accent bg-accent text-accent-foreground shadow-sm'
										: isDisabled
											? 'cursor-not-allowed border-border bg-surface/50 text-muted'
											: 'border-border bg-surface text-foreground-secondary hover:border-border-hover hover:bg-surface-hover'
								}`}
							>
								<span aria-hidden>{tab.icon}</span>
								<span>{t(`hub.tabs.${tab.id}.label`)}</span>
								{isDisabled ? (
									<span className="rounded-full bg-background/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase">
										Soon
									</span>
								) : null}
							</button>
						);
					})}
				</nav>

				<section className="mt-8 rounded-3xl border border-border bg-surface-elevated p-5 shadow-sm sm:p-8">
					<div className="mb-6 flex items-center gap-3 border-b border-border pb-5">
						<span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-subtle text-2xl">
							{currentTab.icon}
						</span>
						<div>
							<h2 className="font-display text-lg font-semibold text-ink">
								{t(`hub.tabs.${currentTab.id}.label`)}
							</h2>
							<p className="text-sm text-muted-foreground">
								{t(`hub.tabs.${currentTab.id}.description`)}
							</p>
						</div>
					</div>

					{activeTab === 'boardgames' ? (
						<BoardgamesPanel />
					) : (
						<ComingSoonPanel tabId={currentTab.id} icon={currentTab.icon} />
					)}
				</section>

				<footer className="mt-10 text-center text-xs text-muted">
					{KSTRIP_NAME} · Covert Expedition · Party games & trip hub
				</footer>
			</div>
		</div>
	);
}
