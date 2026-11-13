'use client';

import { useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { PrizeTier } from '../domain/drawPool';
import type { BoothState, DrawResult } from '../types';
import { BoothApiError, boothEndpoints, boothFetch } from './boothApi';
import { playBoothSound, readMuted, storeMuted } from './boothSound';
import styles from './fmt2026.module.css';
import { PinGate } from './PinGate';
import { LUCK_NOTES, PrizeReveal } from './PrizeReveal';
import { StockBar } from './StockBar';
import { TeacherFigure, type TeacherLook, type TeacherPhase } from './TeacherFigure';
import { BOOTH } from './boothPalette';

/** Placeholder teachers; rename and restyle when the real art arrives. */
const TEACHERS: { name: string; look: TeacherLook }[] = [
	{
		name: 'Thầy FMT',
		look: {
			skin: BOOTH.teacherA.skin,
			hair: BOOTH.teacherA.hair,
			outfit: BOOTH.teacherA.outfit,
			accent: BOOTH.gold,
			longHair: false,
		},
	},
	{
		name: 'Cô FMT',
		look: {
			skin: BOOTH.teacherB.skin,
			hair: BOOTH.teacherB.hair,
			outfit: BOOTH.teacherB.outfit,
			accent: BOOTH.cream,
			longHair: true,
		},
	},
];

type Mode = 'idle' | 'choosing' | 'drawing' | 'reveal';
type DrawStep = 'reach' | 'rummage' | 'pull';

const REFRESH_MS = 15_000;

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export function Fmt2026Booth() {
	const reduced = useReducedMotion() ?? false;
	const [state, setState] = useState<BoothState | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [mode, setMode] = useState<Mode>('idle');
	const [chosen, setChosen] = useState<number | null>(null);
	const [step, setStep] = useState<DrawStep>('reach');
	const [result, setResult] = useState<DrawResult | null>(null);
	const [drawnTier, setDrawnTier] = useState<PrizeTier | 'luck' | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [muted, setMuted] = useState(false);
	const [luckNote, setLuckNote] = useState(LUCK_NOTES[0]!);
	const busy = useRef(false);

	const load = useCallback(async () => {
		try {
			setState(await boothFetch<BoothState>(boothEndpoints.state));
			setLoadError(null);
		} catch (error) {
			setLoadError(error instanceof Error ? error.message : 'Không tải được quầy quà');
		}
	}, []);

	useEffect(() => {
		setMuted(readMuted());
		void load();
	}, [load]);

	// Pick up admin edits (stock, open switch) between turns.
	useEffect(() => {
		if (mode !== 'idle') return;
		const timer = window.setInterval(() => void load(), REFRESH_MS);
		return () => window.clearInterval(timer);
	}, [mode, load]);

	// Preload prize art so the reveal never waits on the network.
	useEffect(() => {
		state?.prizes.forEach((prize) => {
			if (prize.imagePath) new window.Image().src = prize.imagePath;
		});
	}, [state?.prizes]);

	const canDraw = Boolean(state?.unlocked && state.isOpen && state.spinsLeft > 0);

	const startChoosing = useCallback(() => {
		if (!canDraw || mode !== 'idle') return;
		setMessage(null);
		setMode('choosing');
		playBoothSound('pick', muted);
	}, [canDraw, mode, muted]);

	const draw = useCallback(
		async (teacher: number) => {
			if (busy.current) return;
			busy.current = true;
			setChosen(teacher);
			setMode('drawing');
			setStep('reach');
			playBoothSound('pick', muted);

			const request = boothFetch<DrawResult>(boothEndpoints.draw, { method: 'POST' });
			// Handled below; this only stops an early failure being reported as unhandled.
			request.catch(() => undefined);
			try {
				await sleep(reduced ? 150 : 700);
				setStep('rummage');
				playBoothSound('rummage', muted);
				const [drawn] = await Promise.all([request, sleep(reduced ? 300 : 1300)]);
				const tier = drawn.prize?.tier;
				setDrawnTier(tier ?? 'luck');
				const suspense = reduced ? 0 : tier === 'epic' ? 1100 : tier === 'rare' ? 600 : 0;
				if (suspense) {
					playBoothSound('rummage', muted);
					await sleep(suspense);
				}
				setStep('pull');
				playBoothSound('pop', muted);
				await sleep(reduced ? 150 : 650);
				setLuckNote(LUCK_NOTES[Math.floor(Math.random() * LUCK_NOTES.length)]!);
				setResult(drawn);
				setMode('reveal');
				playBoothSound(drawn.prize ? 'fanfare' : 'luck', muted);
			} catch (error) {
				const text = error instanceof BoothApiError ? error.message : 'Mất kết nối, thử lại nhé';
				setMessage(text);
				setMode('idle');
				setChosen(null);
				setDrawnTier(null);
			} finally {
				busy.current = false;
				void load();
			}
		},
		[load, muted, reduced],
	);

	const closeReveal = useCallback(() => {
		setResult(null);
		setChosen(null);
		setDrawnTier(null);
		setMode('idle');
	}, []);

	useEffect(() => {
		function onKey(event: KeyboardEvent) {
			if (event.target instanceof HTMLInputElement) return;
			if (event.code === 'Space' || event.code === 'Enter') {
				event.preventDefault();
				if (mode === 'idle') startChoosing();
				else if (mode === 'reveal') closeReveal();
			}
			if (mode === 'choosing') {
				if (event.code === 'ArrowLeft' || event.key === '1') void draw(0);
				if (event.code === 'ArrowRight' || event.key === '2') void draw(1);
				if (event.code === 'Escape') setMode('idle');
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [mode, startChoosing, closeReveal, draw]);

	function phaseFor(index: number): TeacherPhase {
		if (mode === 'choosing') return 'focus';
		if (mode === 'drawing' || mode === 'reveal') return chosen === index ? step : 'dim';
		return 'idle';
	}

	function toggleMute() {
		setMuted((value) => {
			storeMuted(!value);
			return !value;
		});
	}

	function toggleFullscreen() {
		if (document.fullscreenElement) void document.exitFullscreen();
		else void document.documentElement.requestFullscreen?.().catch(() => undefined);
	}

	return (
		<main className={styles.stage}>
			<div className={styles.sparkles} aria-hidden="true" />
			<header className={styles.topbar}>
				<span className={styles.brand}>
					FMT <span>2026</span>
				</span>
				<div className={styles.tools}>
					<button type="button" className={styles.iconButton} onClick={toggleMute}>
						{muted ? 'Bật tiếng' : 'Tắt tiếng'}
					</button>
					<button type="button" className={styles.iconButton} onClick={toggleFullscreen}>
						Toàn màn hình
					</button>
				</div>
			</header>

			{!state ? (
				<div className={styles.gate}>
					<p className={styles.subtitle}>{loadError ?? 'Đang mở quầy quà…'}</p>
					{loadError && (
						<button type="button" className={styles.cta} onClick={() => void load()}>
							Thử lại
						</button>
					)}
				</div>
			) : !state.unlocked ? (
				<PinGate hasPin={state.hasPin} onUnlocked={() => void load()} />
			) : (
				<div className={styles.floor}>
					<TeacherFigure
						name={TEACHERS[0]!.name}
						look={TEACHERS[0]!.look}
						phase={phaseFor(0)}
						tier={chosen === 0 ? drawnTier : null}
						pickable={mode === 'choosing'}
						onPick={() => void draw(0)}
					/>
					<section className={styles.center} aria-live="polite">
						<p className={styles.eyebrow}>FMT 2026 · Quầy quà</p>
						<h1 className={styles.title}>Nhận quà trở về</h1>
						{mode === 'choosing' ? (
							<p className={styles.subtitle}>
								Chọn thầy hoặc cô. Người được chọn sẽ rút quà cho bạn!
							</p>
						) : mode === 'drawing' ? (
							<p className={styles.subtitle}>
								{step === 'reach'
									? 'Thò tay vào túi…'
									: step === 'rummage'
										? 'Lục lọi…'
										: 'Có rồi!'}
							</p>
						) : !state.isOpen ? (
							<p className={styles.subtitle}>Quầy quà sắp mở. Chờ chút nhé!</p>
						) : state.spinsLeft === 0 ? (
							<p className={styles.subtitle}>Quà đã được trao hết. Cảm ơn bạn đã ghé FMT!</p>
						) : (
							<>
								<p className={styles.subtitle}>
									Còn {state.spinsLeft} lượt. Thầy cô đang giữ túi quà cho bạn.
								</p>
								<button
									type="button"
									className={styles.cta}
									onClick={startChoosing}
									disabled={!canDraw}
								>
									Bốc quà ngay
								</button>
								<span className={styles.hint}>hoặc nhấn phím cách</span>
							</>
						)}
						{mode === 'choosing' && (
							<button type="button" className={styles.iconButton} onClick={() => setMode('idle')}>
								Quay lại
							</button>
						)}
						{message && (
							<p role="alert" className={styles.message}>
								{message}
							</p>
						)}
					</section>
					<TeacherFigure
						name={TEACHERS[1]!.name}
						look={TEACHERS[1]!.look}
						phase={phaseFor(1)}
						tier={chosen === 1 ? drawnTier : null}
						pickable={mode === 'choosing'}
						mirrored
						onPick={() => void draw(1)}
					/>
				</div>
			)}

			{state?.unlocked ? <StockBar prizes={state.prizes} luckLeft={state.luckLeft} /> : <div />}

			<PrizeReveal result={result} luckNote={luckNote} onClose={closeReveal} />
		</main>
	);
}
