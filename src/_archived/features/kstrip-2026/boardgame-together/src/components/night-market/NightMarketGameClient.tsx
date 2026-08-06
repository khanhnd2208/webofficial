'use client';

import Link from 'next/link';
import QRCode from 'react-qr-code';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import PrefsToggleGroup from '@/components/i18n/PrefsToggleGroup';
import { useLocale, useT } from '@/components/i18n/LocaleProvider';
import { Badge, Button, Card, Checkbox, Input, Select, Spinner } from '@/components/ui';
import { COMMODITIES, LEGAL_COMMODITIES, NIGHT_MARKET_POLL_MS } from '@/config/nightMarket';
import { hapticLight, hapticMedium, hapticUrgent } from '@/lib/haptics';
import {
	fetchNightMarketState,
	getNightMarketToken,
	joinNightMarket,
	sendNightMarketAction,
	storeNightMarketToken,
} from '@/lib/night-market/client';
import { playConfirm, playUrgent } from '@/lib/sounds';
import type {
	BetRecord,
	BotProfile,
	CommodityCard,
	GateDecision,
	LegalCommodityId,
	NightMarketAction,
	NightMarketPlayerPublicDTO,
	NightMarketRoomDTO,
} from '@/types/nightMarket';

function actionId() { return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; }

function MarketCard({ card, selected, onClick }: { card: CommodityCard; selected?: boolean; onClick?: () => void }) {
	const t = useT();
	const definition = COMMODITIES[card.commodity];
	return <button type="button" onClick={onClick} disabled={!onClick} className={`min-h-28 rounded-2xl border p-3 text-left transition ${selected ? 'border-purple bg-purple-subtle ring-2 ring-purple/20' : 'border-border bg-surface'} ${onClick ? 'active:scale-[0.98]' : ''}`}>
		<div className="text-3xl">{definition.emoji}</div><p className="mt-2 text-sm font-semibold">{t(`nightMarket.commodity.${card.commodity}`)}</p>
		<p className="mt-1 font-mono text-[10px] text-muted">{definition.value}★ · {definition.penalty}⚖</p>
		<Badge variant={definition.legal ? 'success' : 'danger'} className="mt-2">{definition.legal ? '✓' : '!'}</Badge>
	</button>;
}

function Timer({ state }: { state: NightMarketRoomDTO }) {
	const [now, setNow] = useState(Date.now());
	const serverOffset = useMemo(() => new Date(state.serverNow).getTime() - Date.now(), [state.serverNow]);
	useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(timer); }, []);
	if (!state.phaseEndsAt || state.paused) return state.paused ? <Badge variant="warning">PAUSED</Badge> : null;
	const remaining = Math.max(0, Math.ceil((new Date(state.phaseEndsAt).getTime() - (now + serverOffset)) / 1000));
	return <Badge variant={remaining <= 10 ? 'danger' : 'info'} className="font-mono">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</Badge>;
}

function PlayerStrip({ player }: { player: NightMarketPlayerPublicDTO }) {
	const t = useT();
	return <div className={`rounded-xl border p-3 ${player.isGate ? 'border-purple bg-purple-subtle' : 'border-border bg-surface'}`}>
		<div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="truncate font-semibold">{player.name}</p><div className="mt-1 flex flex-wrap gap-1">{player.controller === 'bot' && <Badge variant="muted">{t('nightMarket.common.bot')}</Badge>}{player.isHost && <Badge variant="info">{t('nightMarket.common.host')}</Badge>}{player.isGate && <Badge variant="warning">{t('nightMarket.common.gate')}</Badge>}</div></div><div className="text-right"><p className="font-mono font-bold">{player.money} 🪙</p><p className="text-xs text-muted">{player.stall.length} 📦</p></div></div>
	</div>;
}

interface ScreenProps { state: NightMarketRoomDTO; act: (action: NightMarketAction) => Promise<void>; busy: boolean; }

function LobbyScreen({ state, act, busy }: ScreenProps) {
	const t = useT(); const { locale } = useLocale();
	const canStart = state.players.length >= 3 && state.players.every((player) => player.controller === 'bot' || player.ready);
	const inviteUrl = typeof window === 'undefined' ? '' : `${window.location.origin}/games/night-market/room/${state.code}`;
	function movePlayer(playerId: string, offset: number) {
		const ids = state.players.map((player) => player.id);
		const from = ids.indexOf(playerId); const to = from + offset;
		if (from < 0 || to < 0 || to >= ids.length) return;
		[ids[from], ids[to]] = [ids[to], ids[from]];
		void act({ type: 'reorder', playerIds: ids });
	}
	return <div className="space-y-4">
		<Card elevated><div className="flex flex-col items-center gap-4 sm:flex-row"><div className="rounded-xl bg-white p-2"><QRCode value={inviteUrl || state.code} size={116} /></div><div><p className="text-sm text-muted">{t('nightMarket.lobby.invite')}</p><p className="font-mono text-4xl font-bold tracking-[0.2em]">{state.code}</p><p className="mt-1 text-sm text-muted-foreground">{t('nightMarket.lobby.copy')}</p></div></div></Card>
		<Card><div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold">{t('nightMarket.lobby.seats')} · {state.players.length}/6</h2>{state.self && <Button size="sm" variant={state.self.ready ? 'success' : 'secondary'} onClick={() => act({ type: 'ready', ready: !state.self!.ready })}>{state.self.ready ? '✓ ' : ''}{t('nightMarket.common.ready')}</Button>}</div><div className="mt-4 grid gap-2">{state.players.map((player, index) => <div key={player.id} className="flex items-center gap-2"><div className="flex-1"><PlayerStrip player={player} /></div>{state.isHost && <div className="flex flex-col"><Button aria-label={`Move ${player.name} up`} size="sm" variant="ghost" disabled={index === 0} onClick={() => movePlayer(player.id, -1)}>↑</Button><Button aria-label={`Move ${player.name} down`} size="sm" variant="ghost" disabled={index === state.players.length - 1} onClick={() => movePlayer(player.id, 1)}>↓</Button></div>}{state.isHost && player.controller === 'bot' && <Button size="sm" variant="ghost" onClick={() => act({ type: 'remove-bot', playerId: player.id })}>{t('nightMarket.lobby.remove')}</Button>}</div>)}</div>
		{state.isHost && state.players.length < 6 && <div className="mt-4 grid grid-cols-3 gap-2">{(['cautious','balanced','daring'] as BotProfile[]).map((profile) => <Button key={profile} size="sm" variant="secondary" onClick={() => act({ type: 'add-bot', profile })}>+ {t(`nightMarket.profile.${profile}`)}</Button>)}</div>}</Card>
		{state.isHost && <Card><h2 className="font-display text-lg font-semibold">{t('nightMarket.lobby.settings')}</h2><div className="mt-4 space-y-4"><label className="block text-sm text-foreground-secondary">{t('nightMarket.lobby.cycles')}<Select className="mt-1" value={state.settings.cycles} onChange={(event) => act({ type: 'settings', settings: { cycles: Number(event.target.value) as 1 | 2 } })}><option value="1">1</option><option value="2">2</option></Select></label><label className="block text-sm text-foreground-secondary">{t('nightMarket.lobby.interrogation')}<Select className="mt-1" value={state.settings.interrogationSeconds ?? 'auto'} onChange={(event) => act({ type: 'settings', settings: { interrogationSeconds: event.target.value === 'auto' ? null : Number(event.target.value) } })}><option value="auto">{t('nightMarket.lobby.adaptive')}</option><option value="120">2:00</option><option value="180">3:00</option><option value="240">4:00</option><option value="300">5:00</option></Select></label><Checkbox label={t('nightMarket.lobby.betting')} checked={state.settings.bettingEnabled} onChange={(event) => act({ type: 'settings', settings: { bettingEnabled: event.target.checked } })} /><Checkbox label={t('nightMarket.lobby.missions')} checked={state.settings.secretMissionsEnabled} onChange={(event) => act({ type: 'settings', settings: { secretMissionsEnabled: event.target.checked } })} /><Checkbox label={t('nightMarket.lobby.goodsBribes')} checked={state.settings.goodsBribesEnabled} onChange={(event) => act({ type: 'settings', settings: { goodsBribesEnabled: event.target.checked } })} /><Checkbox label={t('nightMarket.lobby.animation')} checked={state.settings.animationEnabled} onChange={(event) => act({ type: 'settings', settings: { animationEnabled: event.target.checked } })} /></div></Card>}
		{state.isHost && <><Button fullWidth loading={busy} disabled={!canStart} onClick={() => act({ type: 'start' })}>🏮 {t('nightMarket.lobby.start')}</Button>{!canStart && <p className="text-center text-sm text-muted">{t('nightMarket.lobby.needPlayers')}</p>}</>}
		{!state.isHost && <p className="text-center text-sm text-muted">{locale === 'vi' ? 'Chờ chủ phòng mở chợ…' : 'Waiting for the host to open the market…'}</p>}
	</div>;
}

function PackingScreen({ state, act, busy }: ScreenProps) {
	const t = useT(); const [selected, setSelected] = useState<string[]>([]); const [declaration, setDeclaration] = useState<LegalCommodityId>('festival-cake');
	if (!state.self) return null;
	if (state.self.isGate) return <Card elevated className="py-12 text-center"><div className="text-5xl">🛡️</div><p className="mt-4 font-semibold">{t('nightMarket.packing.gateWait')}</p></Card>;
	if (state.self.bag) return <Card elevated className="py-12 text-center"><div className="text-5xl">🔒</div><p className="mt-4 font-semibold">{t('nightMarket.packing.locked')}</p></Card>;
	function toggle(id: string) { setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : items.length < 5 ? [...items, id] : items); }
	return <div className="space-y-4"><Card><h2 className="font-display text-lg font-semibold">{t('nightMarket.packing.choose')}</h2><p className="mt-1 text-sm text-muted">{t('nightMarket.packing.selected', { count: selected.length })}</p><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{state.self.hand.map((card) => <MarketCard key={card.id} card={card} selected={selected.includes(card.id)} onClick={() => toggle(card.id)} />)}</div></Card><Card><p className="text-sm font-medium">{t('nightMarket.packing.declare')}</p><div className="mt-3 grid grid-cols-2 gap-2">{LEGAL_COMMODITIES.map((id) => <Button key={id} size="sm" variant={declaration === id ? 'primary' : 'secondary'} onClick={() => setDeclaration(id)}>{COMMODITIES[id].emoji} {t(`nightMarket.commodity.${id}`)}</Button>)}</div></Card><Button fullWidth loading={busy} disabled={selected.length < 1} onClick={() => act({ type: 'pack', cardIds: selected, declaration })}>🔒 {t('nightMarket.packing.lock')}</Button></div>;
}

function Declarations({ state }: { state: NightMarketRoomDTO }) {
	const t = useT(); return <div className="grid gap-2">{state.players.filter((player) => player.bag).map((player) => <Card key={player.id} className="py-3"><div className="flex items-center justify-between"><span className="font-semibold">{player.name}</span><span>{player.bag!.cardCount} × {COMMODITIES[player.bag!.declaration].emoji} {t(`nightMarket.commodity.${player.bag!.declaration}`)}</span></div></Card>)}</div>;
}

function InterrogationScreen({ state, act, busy }: ScreenProps) {
	const t = useT(); const { locale } = useLocale(); const [money, setMoney] = useState(1); const [goods, setGoods] = useState('');
	const self = state.self; if (!self) return null; const isGate = self.isGate;
	return <div className="space-y-4"><p className="text-center text-sm font-medium text-muted-foreground">🗣️ {t('nightMarket.interrogation.title')}</p><Declarations state={state} />
		{state.messages.length > 0 && <Card className="space-y-2">{state.messages.map((message) => <p key={message.id} className="text-sm"><strong>{state.players.find((player) => player.id === message.playerId)?.name}:</strong> “{locale === 'vi' ? message.textVi : message.textEn}”</p>)}</Card>}
		{isGate ? <Card><h3 className="font-semibold">{t('nightMarket.interrogation.bribe')}</h3><div className="mt-3 space-y-2">{(state.bribesForGate ?? []).length === 0 && <p className="text-sm text-muted">—</p>}{(state.bribesForGate ?? []).map((offer) => <div key={offer.merchantId} className="flex items-center justify-between rounded-xl border border-border p-3"><span>{state.players.find((player) => player.id === offer.merchantId)?.name} · {offer.money} 🪙 {offer.stallCardId ? '+ 📦' : ''}</span><Button size="sm" variant={offer.accepted ? 'success' : 'primary'} disabled={offer.accepted} onClick={() => act({ type: 'accept-bribe', merchantId: offer.merchantId })}>{offer.accepted ? '✓' : t('nightMarket.interrogation.accept')}</Button></div>)}</div></Card> : <Card><h3 className="font-semibold">{t('nightMarket.interrogation.bribe')}</h3>{self.activeBribe?.accepted ? <p className="mt-3 rounded-xl bg-success-subtle p-3 text-sm text-success">✓ {t('nightMarket.interrogation.accepted')}</p> : <><div className="mt-3 grid grid-cols-2 gap-2"><label className="text-sm">{t('nightMarket.interrogation.amount')}<Select value={money} onChange={(event) => setMoney(Number(event.target.value))}>{[1,2,3,4,5].map((amount) => <option key={amount}>{amount}</option>)}</Select></label>{state.settings.goodsBribesEnabled && <label className="text-sm">{t('nightMarket.interrogation.goods')}<Select value={goods} onChange={(event) => setGoods(event.target.value)}><option value="">{t('nightMarket.interrogation.noGoods')}</option>{self.stall.filter((card) => COMMODITIES[card.commodity].legal).map((card) => <option key={card.id} value={card.id}>{t(`nightMarket.commodity.${card.commodity}`)}</option>)}</Select></label>}</div><div className="mt-3 flex gap-2"><Button size="sm" loading={busy} disabled={self.money < money} onClick={() => act({ type: 'bribe', money, stallCardId: goods || undefined })}>{t('nightMarket.interrogation.offer')}</Button>{self.activeBribe && <Button size="sm" variant="ghost" onClick={() => act({ type: 'cancel-bribe' })}>{t('nightMarket.interrogation.cancel')}</Button>}</div></>}</Card>}
		{!isGate && state.players.find((player) => player.isGate)?.controller === 'bot' && <div className="grid grid-cols-3 gap-2"><Button size="sm" variant="secondary" onClick={() => act({ type: 'quick-reply', kind: 'truth' })}>{t('nightMarket.interrogation.truth')}</Button><Button size="sm" variant="secondary" onClick={() => act({ type: 'quick-reply', kind: 'accuse' })}>{t('nightMarket.interrogation.accuse')}</Button><Button size="sm" variant="secondary" onClick={() => act({ type: 'quick-reply', kind: 'raise' })}>{t('nightMarket.interrogation.raise')}</Button></div>}
		{isGate && <Button fullWidth variant="secondary" onClick={() => act({ type: 'finish-interrogation' })}>{t('nightMarket.interrogation.finish')}</Button>}
	</div>;
}

function BettingScreen({ state, act, busy }: ScreenProps) {
	const t = useT(); const self = state.self; const [bets, setBets] = useState<Array<{ targetId: string; prediction: 'truth' | 'lie'; amount: 1 | 2 }>>([]);
	if (!self) return null; if (self.isGate) return <Card elevated className="py-12 text-center">🔐<p className="mt-3">{t('nightMarket.betting.title')}</p></Card>;
	const locked = self.bets.length > 0; const budget = bets.reduce((sum, bet) => sum + bet.amount, 0);
	function choose(targetId: string, prediction: 'truth' | 'lie', amount: 1 | 2) { setBets((current) => { const others = current.filter((bet) => bet.targetId !== targetId); const otherBudget = others.reduce((sum, bet) => sum + bet.amount, 0); return otherBudget + amount <= 2 ? [...others, { targetId, prediction, amount }] : current; }); }
	return <div className="space-y-4"><h2 className="text-center font-display text-xl font-semibold">{t('nightMarket.betting.title')}</h2>{state.players.filter((player) => player.bag && player.id !== self.id).map((player) => <Card key={player.id}><p className="font-semibold">{player.name} · {player.bag!.cardCount} {t(`nightMarket.commodity.${player.bag!.declaration}`)}</p><div className="mt-3 grid grid-cols-2 gap-2">{(['truth','lie'] as const).flatMap((prediction) => ([1,2] as const).map((amount) => { const active = bets.some((bet) => bet.targetId === player.id && bet.prediction === prediction && bet.amount === amount); return <Button key={`${prediction}-${amount}`} size="sm" variant={active ? (prediction === 'truth' ? 'success' : 'destructive') : 'secondary'} disabled={locked} onClick={() => choose(player.id, prediction, amount)}>{t(`nightMarket.betting.${prediction}`)} · {amount}</Button>; }))}</div></Card>)}<Button fullWidth loading={busy} disabled={locked || budget > 2 || budget > self.money} onClick={() => act({ type: 'bet', bets })}>{bets.length ? `${t('nightMarket.common.submit')} · ${budget} 🪙` : t('nightMarket.betting.skip')}</Button>{locked && <p className="text-center text-success">✓ {t('nightMarket.betting.locked')}</p>}</div>;
}

function DecisionScreen({ state, act, busy }: ScreenProps) {
	const t = useT(); const [choices, setChoices] = useState<Record<string, GateDecision>>({}); const self = state.self;
	if (!self?.isGate) return <Card elevated className="py-12 text-center"><div className="text-5xl">⚖️</div><p className="mt-4">{t('nightMarket.decision.title')}</p></Card>;
	const targets = state.players.filter((player) => player.bag);
	return <div className="space-y-4"><h2 className="text-center font-display text-xl font-semibold">{t('nightMarket.decision.title')}</h2>{targets.map((player) => { const locked = (state.bribesForGate ?? []).some((offer) => offer.merchantId === player.id && offer.accepted); return <Card key={player.id}><p className="font-semibold">{player.name} · {player.bag!.cardCount} {t(`nightMarket.commodity.${player.bag!.declaration}`)}</p><div className="mt-3 grid grid-cols-2 gap-2"><Button size="sm" variant={locked || choices[player.id] === 'pass' ? 'success' : 'secondary'} onClick={() => setChoices((items) => ({ ...items, [player.id]: 'pass' }))}>{t('nightMarket.decision.pass')}</Button><Button size="sm" variant={choices[player.id] === 'inspect' ? 'destructive' : 'secondary'} disabled={locked} onClick={() => setChoices((items) => ({ ...items, [player.id]: 'inspect' }))}>{locked ? `🔒 ${t('nightMarket.decision.locked')}` : t('nightMarket.decision.inspect')}</Button></div></Card>; })}<Button fullWidth loading={busy} disabled={targets.some((player) => !(choices[player.id] || (state.bribesForGate ?? []).some((offer) => offer.merchantId === player.id && offer.accepted)))} onClick={() => act({ type: 'decide', decisions: targets.map((player) => ({ merchantId: player.id, decision: choices[player.id] ?? 'pass' })) })}>{t('nightMarket.decision.confirm')}</Button></div>;
}

function RevealScreen({ state, act }: ScreenProps) {
	const t = useT(); const settled = state.players.filter((player) => player.bag?.settled); const player = settled[settled.length - 1];
	if (!player?.bag) return <Card><Spinner /> </Card>;
	return <Card elevated className="text-center"><p className="text-sm text-muted">{player.name}</p><p className="mt-1 font-semibold">{t('nightMarket.reveal.declared', { count: player.bag.cardCount, item: t(`nightMarket.commodity.${player.bag.declaration}`) })}</p>{player.bag.acceptedBribe && <p className="mt-3 rounded-lg bg-warning-subtle p-2 text-sm text-warning">🤝 {player.bag.acceptedBribe.money} 🪙{player.bag.acceptedBribe.hasGoods ? ' + 📦' : ''}</p>}<div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-2 sm:grid-cols-3">{player.bag.cards?.map((card) => <MarketCard key={card.id} card={card} />)}</div><p className={`font-display mt-6 text-3xl font-black ${player.bag.truthful ? 'text-success' : 'text-danger'}`}>{t(`nightMarket.reveal.${player.bag.truthful ? 'truthful' : 'lying'}`)}</p>{player.bag.penalty != null && <p className="mt-2 text-danger">{t('nightMarket.reveal.penalty')}: {player.bag.penalty} 🪙</p>}{player.bag.compensation != null && <p className="mt-2 text-success">{t('nightMarket.reveal.compensation')}: {player.bag.compensation} 🪙</p>}<Button className="mt-6" onClick={() => act({ type: 'reveal-next' })}>{t('nightMarket.reveal.next')}</Button></Card>;
}

function awardsFor(state: NightMarketRoomDTO, playerId: string): string[] {
	const withStats = state.players.filter((player) => player.stats);
	const isMax = (value: (player: NightMarketPlayerPublicDTO) => number, requirePositive = true) => {
		const maximum = Math.max(...withStats.map(value), 0);
		return (!requirePositive || maximum > 0) && value(state.players.find((player) => player.id === playerId)!) === maximum;
	};
	const player = state.players.find((item) => item.id === playerId);
	if (!player?.stats) return [];
	const awards: string[] = [];
	if (isMax((item) => item.stats!.lies)) awards.push('liar');
	if (isMax((item) => item.stats!.truthsInspected)) awards.push('suspiciousTruth');
	if (isMax((item) => item.stats!.inspections ? item.stats!.correctInspections / item.stats!.inspections : 0)) awards.push('sharpGate');
	if (isMax((item) => item.stats!.wrongInspections)) awards.push('paranoidGate');
	if (isMax((item) => item.stats!.bribesPaid)) awards.push('briber');
	if (isMax((item) => item.stats!.bribesReceived)) awards.push('corrupt');
	if (isMax((item) => item.stats!.contrabandPassed)) awards.push('daring');
	if (isMax((item) => item.stats!.betsPlaced ? item.stats!.betsWon / item.stats!.betsPlaced : 0)) awards.push('prophet');
	if (isMax((item) => item.stats!.biggestBluffValue)) awards.push('bluff');
	if (isMax((item) => item.stats!.costliestTruth)) awards.push('costlyTruth');
	return awards;
}

function FinalScreen({ state, act, busy }: ScreenProps) {
	const t = useT(); return <div className="space-y-4"><header className="py-6 text-center"><div className="text-6xl">🏆</div><p className="mt-3 text-sm text-muted">{t('nightMarket.result.champion')}</p><h2 className="font-display text-3xl font-bold">{state.players.find((player) => player.id === state.results[0]?.playerId)?.name}</h2></header>{state.results.map((result) => { const player = state.players.find((item) => item.id === result.playerId); const awards = awardsFor(state, result.playerId); return <Card key={result.playerId} elevated={result.rank === 1}><div className="flex items-center justify-between"><div><p className="font-semibold">#{result.rank} {player?.name}</p><p className="mt-1 text-xs text-muted">{t('nightMarket.result.money')} {result.moneyPoints} · {t('nightMarket.result.goods')} {result.goodsPoints} · {t('nightMarket.result.market')} {result.marketBonus} · {t('nightMarket.result.mission')} {result.missionBonus}</p>{player?.stats && <p className="mt-2 text-xs text-muted-foreground">🎭 {player.stats.lies} · 🚫 {player.stats.contrabandPassed} · 🤝 {player.stats.bribesPaid}/{player.stats.bribesReceived} · 🔮 {player.stats.betsWon}/{player.stats.betsPlaced}</p>}{awards.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{awards.map((award) => <Badge key={award} variant="warning">{t(`nightMarket.award.${award}`)}</Badge>)}</div>}</div><p className="font-mono text-2xl font-bold">{result.total}</p></div></Card>; })}{state.isHost && <Button fullWidth loading={busy} onClick={() => act({ type: 'play-again' })}>{t('nightMarket.result.again')}</Button>}</div>;
}

export default function NightMarketGameClient({ code }: { code: string }) {
	const t = useT(); const [token, setToken] = useState<string | null>(null); const tokenRef = useRef<string | null>(null); const phaseRef = useRef<string | null>(null); const [state, setState] = useState<NightMarketRoomDTO | null>(null); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [joinName, setJoinName] = useState('');
	const errorKey = error ? `nightMarket.error.${error}` : '';
	const translatedError = errorKey ? t(errorKey) : '';
	const errorText = translatedError === errorKey ? error : translatedError;
	const refresh = useCallback(async () => { try { const next = await fetchNightMarketState(code, tokenRef.current); setState(next); setError(''); } catch (reason) { setError(reason instanceof Error ? reason.message : 'UNKNOWN'); } finally { setLoading(false); } }, [code]);
	useEffect(() => { const stored = getNightMarketToken(code); tokenRef.current = stored; setToken(stored); void refresh(); }, [code, refresh]);
	useEffect(() => { const timer = setInterval(() => { if (!document.hidden) void refresh(); }, NIGHT_MARKET_POLL_MS); return () => clearInterval(timer); }, [refresh]);
	useEffect(() => {
		if (!state || phaseRef.current === state.phase) return;
		const previous = phaseRef.current; phaseRef.current = state.phase;
		if (!previous) return;
		if (state.phase === 'reveal') { hapticUrgent(); playUrgent(); }
		else if (state.phase === 'final-score') { hapticMedium(); playConfirm(); }
		else if (state.phase === 'packing' || state.phase === 'gate-decision') hapticMedium();
		else hapticLight();
	}, [state]);
	const act = useCallback(async (action: NightMarketAction) => { if (!state || !tokenRef.current) return; setBusy(true); setError(''); try { const next = await sendNightMarketAction(code, { token: tokenRef.current, actionId: actionId(), expectedVersion: state.version, action }); setState(next); } catch (reason) { setError(reason instanceof Error ? reason.message : 'UNKNOWN'); await refresh(); } finally { setBusy(false); } }, [code, refresh, state]);
	async function join() { setBusy(true); try { const data = await joinNightMarket(code, joinName, token ?? undefined); storeNightMarketToken(code, data.playerToken); tokenRef.current = data.playerToken; setToken(data.playerToken); setState(data.state); setError(''); } catch (reason) { setError(reason instanceof Error ? reason.message : 'UNKNOWN'); } finally { setBusy(false); } }
	if (loading || !state) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="text-center"><Spinner size="lg" /><p className="mt-3 text-muted">{t('nightMarket.common.loading')}</p></div></div>;
	if (!state.self) return <div className="min-h-screen bg-background px-4 py-12"><Card elevated className="mx-auto max-w-sm space-y-4"><div className="text-center text-5xl">🏮</div><h1 className="text-center font-display text-2xl font-bold">{state.name}</h1>{error && <p className="rounded-lg bg-danger-subtle p-2 text-sm text-danger">{errorText}</p>}<Input value={joinName} onChange={(event) => setJoinName(event.target.value)} placeholder={t('nightMarket.menu.yourName')} /><Button fullWidth loading={busy} disabled={!joinName.trim()} onClick={join}>{t('nightMarket.menu.join')}</Button></Card></div>;
	let screen: React.ReactNode;
	if (state.phase === 'lobby') screen = <LobbyScreen state={state} act={act} busy={busy} />;
	else if (state.phase === 'packing') screen = <PackingScreen state={state} act={act} busy={busy} />;
	else if (state.phase === 'interrogation') screen = <InterrogationScreen state={state} act={act} busy={busy} />;
	else if (state.phase === 'betting') screen = <BettingScreen state={state} act={act} busy={busy} />;
	else if (state.phase === 'gate-decision') screen = <DecisionScreen state={state} act={act} busy={busy} />;
	else if (state.phase === 'reveal') screen = <RevealScreen state={state} act={act} busy={busy} />;
	else if (state.phase === 'round-summary') screen = <Card elevated className="py-12 text-center"><div className="text-5xl">📊</div><p className="mt-4">{t('nightMarket.summary.lies')}: <strong>{state.roundSummary?.lies ?? 0}</strong></p><p>{t('nightMarket.summary.contraband')}: <strong>{state.roundSummary?.contrabandPassed ?? 0}</strong></p><p className="mt-3 text-sm text-muted">{t('nightMarket.summary.next')}</p></Card>;
	else if (state.phase === 'final-score') screen = <FinalScreen state={state} act={act} busy={busy} />;
	else screen = <Card elevated className="py-12 text-center"><div className="text-5xl">🛎️</div><p className="mt-4 font-display text-xl font-semibold">{state.players.find((player) => player.isGate)?.name} · {t('nightMarket.common.gate')}</p></Card>;
	return <div className="min-h-screen bg-background px-4 py-5"><div className="mx-auto max-w-2xl">
		<header className="mb-5 flex items-center justify-between gap-3"><div><Link href="/games/night-market" className="text-xs text-muted">← {t('nightMarket.title')}</Link><h1 className="font-display text-xl font-bold">{state.name}</h1><p className="text-xs text-muted">{t('nightMarket.common.cycle')} {state.cycle}/{state.settings.cycles} · {t('nightMarket.common.round')} {state.round}/{state.totalRounds}</p></div><div className="flex items-center gap-2"><Timer state={state} />{state.isHost && state.phase !== 'lobby' && state.phase !== 'final-score' && <Button aria-label={state.paused ? 'Resume game' : 'Pause game'} size="sm" variant="ghost" onClick={() => act({ type: state.paused ? 'resume' : 'pause' })}>{state.paused ? '▶' : 'Ⅱ'}</Button>}<PrefsToggleGroup /></div></header>
		{error && <div className="mb-4 rounded-xl border border-danger/30 bg-danger-subtle p-3 text-sm text-danger">{errorText}</div>}
		<div className="mb-4 flex gap-2 overflow-x-auto pb-1">{state.players.map((player) => <div key={player.id} className="min-w-40"><PlayerStrip player={player} /></div>)}</div>
		{state.self.mission && state.phase !== 'lobby' && <Card className="mb-4 border-dashed py-3"><p className="text-xs text-muted">🎯 {t('nightMarket.result.mission')}</p><p className="font-semibold">{t(`nightMarket.mission.${state.self.mission}`)}</p></Card>}
		{screen}
	</div></div>;
}
