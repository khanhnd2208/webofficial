'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import PrefsToggleGroup from '@/components/i18n/PrefsToggleGroup';
import { useT } from '@/components/i18n/LocaleProvider';
import { Button, Card, Input } from '@/components/ui';
import { createNightMarket, joinNightMarket, storeNightMarketToken } from '@/lib/night-market/client';

export default function NightMarketMenuClient() {
	const t = useT();
	const router = useRouter();
	const [hostName, setHostName] = useState('');
	const [roomName, setRoomName] = useState('Chợ Trăng');
	const [joinName, setJoinName] = useState('');
	const [code, setCode] = useState('');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const errorKey = error ? `nightMarket.error.${error}` : '';
	const translatedError = errorKey ? t(errorKey) : '';
	const errorText = translatedError === errorKey ? error : translatedError;

	async function createRoom() {
		setBusy(true); setError('');
		try {
			const data = await createNightMarket({ name: roomName, hostName });
			storeNightMarketToken(data.state.code, data.playerToken);
			router.push(`/games/night-market/room/${data.state.code}`);
		} catch (reason) { setError(reason instanceof Error ? reason.message : 'UNKNOWN'); }
		finally { setBusy(false); }
	}

	async function joinRoom() {
		setBusy(true); setError('');
		try {
			const normalized = code.trim().toUpperCase();
			const data = await joinNightMarket(normalized, joinName);
			storeNightMarketToken(normalized, data.playerToken);
			router.push(`/games/night-market/room/${normalized}`);
		} catch (reason) { setError(reason instanceof Error ? reason.message : 'UNKNOWN'); }
		finally { setBusy(false); }
	}

	return (
		<div className="min-h-screen bg-background px-4 py-8">
			<div className="mx-auto max-w-lg">
				<div className="flex items-center justify-between"><Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← {t('nightMarket.common.back')}</Link><PrefsToggleGroup /></div>
				<header className="py-10 text-center">
					<div className="text-6xl" aria-hidden>🏮</div>
					<p className="mt-4 font-mono text-xs uppercase tracking-[0.25em] text-purple">{t('nightMarket.menu.eyebrow')}</p>
					<h1 className="font-display mt-2 text-4xl font-bold text-ink">{t('nightMarket.title')}</h1>
					<p className="mx-auto mt-3 max-w-md text-muted-foreground">{t('nightMarket.menu.intro')}</p>
				</header>
				{error && <div className="mb-4 rounded-xl border border-danger/30 bg-danger-subtle p-3 text-sm text-danger">{errorText}</div>}
				<div className="grid gap-4 sm:grid-cols-2">
					<Card elevated className="space-y-3">
						<h2 className="font-display text-lg font-semibold">{t('nightMarket.menu.create')}</h2>
						<Input value={hostName} onChange={(event) => setHostName(event.target.value)} placeholder={t('nightMarket.menu.yourName')} maxLength={24} />
						<Input value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder={t('nightMarket.menu.roomName')} maxLength={24} />
						<Button fullWidth loading={busy} disabled={!hostName.trim() || !roomName.trim()} onClick={createRoom}>{t('nightMarket.menu.create')}</Button>
					</Card>
					<Card elevated className="space-y-3">
						<h2 className="font-display text-lg font-semibold">{t('nightMarket.menu.join')}</h2>
						<Input value={joinName} onChange={(event) => setJoinName(event.target.value)} placeholder={t('nightMarket.menu.yourName')} maxLength={24} />
						<Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder={t('nightMarket.menu.code')} maxLength={6} className="font-mono uppercase tracking-widest" />
						<Button variant="secondary" fullWidth loading={busy} disabled={!joinName.trim() || code.trim().length !== 6} onClick={joinRoom}>{t('nightMarket.menu.join')}</Button>
					</Card>
				</div>
				<Link href="/games/night-market/guide" className="mt-5 block rounded-xl border border-border bg-surface p-4 text-center font-medium hover:bg-surface-hover">📖 {t('nightMarket.menu.guide')}</Link>
			</div>
		</div>
	);
}
