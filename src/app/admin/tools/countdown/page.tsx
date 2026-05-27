"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const STORAGE_KEY = "admin_countdown_settings";

// ─── Types ────────────────────────────────────────────────
interface SavedSettings {
	totalSeconds: number;
	warningSeconds: number;
}

type TimerMode = "settings" | "running" | "paused" | "finished";

// ─── Helpers ─────────────────────────────────────────────
function formatTime(totalSec: number) {
	const h = Math.floor(totalSec / 3600);
	const m = Math.floor((totalSec % 3600) / 60);
	const s = totalSec % 60;
	return {
		h: String(h).padStart(2, "0"),
		m: String(m).padStart(2, "0"),
		s: String(s).padStart(2, "0"),
		hasHours: h > 0,
	};
}

function loadSettings(): SavedSettings {
	if (typeof window === "undefined") return { totalSeconds: 300, warningSeconds: 60 };
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) return JSON.parse(raw) as SavedSettings;
	} catch {
		/* empty */
	}
	return { totalSeconds: 300, warningSeconds: 60 };
}

function saveSettings(s: SavedSettings) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
	} catch {
		/* empty */
	}
}

// ─── Icons ────────────────────────────────────────────────
const Icons = {
	Play: () => (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
			<polygon points="5 3 19 12 5 21 5 3" />
		</svg>
	),
	Pause: () => (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
			<rect x="6" y="4" width="4" height="16" rx="1" />
			<rect x="14" y="4" width="4" height="16" rx="1" />
		</svg>
	),
	Reset: () => (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
			<path d="M3 3v5h5" />
		</svg>
	),
	Expand: () => (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M8 3H5a2 2 0 0 0-2 2v3" />
			<path d="M21 8V5a2 2 0 0 0-2-2h-3" />
			<path d="M3 16v3a2 2 0 0 0 2 2h3" />
			<path d="M16 21h3a2 2 0 0 0 2-2v-3" />
		</svg>
	),
	Compress: () => (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M8 3v3a2 2 0 0 1-2 2H3" />
			<path d="M21 8h-3a2 2 0 0 1-2-2V3" />
			<path d="M3 16h3a2 2 0 0 1 2 2v3" />
			<path d="M16 21v-3a2 2 0 0 1 2-2h3" />
		</svg>
	),
	Back: () => (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M19 12H5" />
			<path d="M12 5l-7 7 7 7" />
		</svg>
	),
};

// ─── Number Input ─────────────────────────────────────────
function NumInput({
	label,
	value,
	max,
	onChange,
}: {
	label: string;
	value: number;
	max: number;
	onChange: (v: number) => void;
}) {
	return (
		<div className="flex flex-col items-center gap-1.5">
			<label className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</label>
			<input
				type="number"
				inputMode="numeric"
				min={0}
				max={max}
				value={value}
				onChange={(e) => onChange(Math.max(0, Math.min(max, parseInt(e.target.value, 10) || 0)))}
				className="w-20 rounded-xl border border-border bg-background py-3 text-center text-3xl font-black text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
				style={{ fontVariantNumeric: "tabular-nums" }}
			/>
		</div>
	);
}

// ─── Main Component ───────────────────────────────────────
export default function CountdownTimerPage() {
	// Settings form inputs
	const [sH, setSH] = useState(0);
	const [sM, setSM] = useState(5);
	const [sS, setSS] = useState(0);
	const [wM, setWM] = useState(1);
	const [wS, setWS] = useState(0);

	// Timer state
	const [mode, setMode] = useState<TimerMode>("settings");
	const [remaining, setRemaining] = useState(0);
	const [totalSec, setTotalSec] = useState(300);
	const [warnSec, setWarnSec] = useState(60);
	const [isFullscreen, setIsFullscreen] = useState(false);

	const containerRef = useRef<HTMLDivElement>(null);
	// Wall-clock end time — the timestamp (ms) when the countdown reaches zero.
	// Used so the timer stays accurate when the tab is hidden/throttled.
	const endTimeRef = useRef<number>(0);
	// Mirror of `remaining` in a ref so async handlers always read the latest value.
	const remainingRef = useRef<number>(0);

	// Hydrate from localStorage
	useEffect(() => {
		const saved = loadSettings();
		setSH(Math.floor(saved.totalSeconds / 3600));
		setSM(Math.floor((saved.totalSeconds % 3600) / 60));
		setSS(saved.totalSeconds % 60);
		setWM(Math.floor(saved.warningSeconds / 60));
		setWS(saved.warningSeconds % 60);
	}, []);

	// Keep remainingRef in sync so closures always see the latest value
	useEffect(() => { remainingRef.current = remaining; }, [remaining]);

	// Fullscreen change listener
	useEffect(() => {
		const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
		document.addEventListener("fullscreenchange", onFSChange);
		return () => document.removeEventListener("fullscreenchange", onFSChange);
	}, []);

	// ─── Wall-clock countdown ─────────────────────────────
	// Instead of decrementing by 1 per tick (broken when tab is hidden),
	// we diff Date.now() against the pre-computed endTimeRef each tick.
	// The interval is just a trigger — actual time comes from the system clock.
	useEffect(() => {
		if (mode !== "running") return;
		const sync = () => {
			const r = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
			setRemaining(r);
			if (r <= 0) setMode("finished");
		};
		sync(); // immediate sync when starting / resuming
		const id = setInterval(sync, 500); // 500 ms — responsive but cheap
		return () => clearInterval(id);
	}, [mode]);

	// Sync immediately when the tab becomes visible again
	useEffect(() => {
		const onVisible = () => {
			if (mode !== "running") return;
			const r = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
			setRemaining(r);
			if (r <= 0) setMode("finished");
		};
		document.addEventListener("visibilitychange", onVisible);
		return () => document.removeEventListener("visibilitychange", onVisible);
	}, [mode]);

	// Keyboard shortcuts (active when timer is shown)
	useEffect(() => {
		if (mode === "settings") return;
		const onKey = (e: KeyboardEvent) => {
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
			if (e.code === "Space") {
				e.preventDefault();
				setMode((cur) => {
					if (cur === "running") return "paused";
					if (cur === "paused") {
						// Resuming: shift endTime forward by the time we were paused
						endTimeRef.current = Date.now() + remainingRef.current * 1000;
						return "running";
					}
					return cur;
				});
			}
			if (e.code === "KeyF") {
				if (!document.fullscreenElement) {
					containerRef.current?.requestFullscreen().catch(() => {});
				} else {
					document.exitFullscreen().catch(() => {});
				}
			}
			if (e.code === "KeyR") {
				e.preventDefault();
				setMode("settings");
				setRemaining(0);
				if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [mode]);

	// ─── Handlers ──────────────────────────────────────────
	const handleStart = () => {
		const total = sH * 3600 + sM * 60 + sS;
		if (total <= 0) return;
		const warn = wM * 60 + wS;
		saveSettings({ totalSeconds: total, warningSeconds: warn });
		setTotalSec(total);
		setWarnSec(warn);
		setRemaining(total);
		endTimeRef.current = Date.now() + total * 1000; // anchor wall-clock end
		setMode("running");
	};

	const handlePauseResume = () => {
		setMode((cur) => {
			if (cur === "running") return "paused";
			if (cur === "paused") {
				// Resuming: recalculate endTime based on current remaining
				endTimeRef.current = Date.now() + remainingRef.current * 1000;
				return "running";
			}
			return cur;
		});
	};

	const handleReset = () => {
		setMode("settings");
		setRemaining(0);
		if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
	};

	const toggleFullscreen = () => {
		if (!document.fullscreenElement) {
			containerRef.current?.requestFullscreen().catch(() => {});
		} else {
			document.exitFullscreen().catch(() => {});
		}
	};

	// ─── Derived state ─────────────────────────────────────
	const isWarning = mode !== "settings" && remaining > 0 && remaining <= warnSec;
	const isFinished = mode === "finished";
	const progress = totalSec > 0 ? remaining / totalSec : 0;
	const { h, m, s, hasHours } = formatTime(remaining);
	const timeStr = hasHours ? `${h}:${m}:${s}` : `${m}:${s}`;
	const zeroStr = hasHours ? "00:00:00" : "00:00";

	const clockSize = isFullscreen
		? "clamp(7rem, 22vw, 28rem)"
		: "clamp(4.5rem, 12vw, 9rem)";

	const warnLabel =
		wM > 0
			? `${wM} phút${wS > 0 ? ` ${wS} giây` : ""}`
			: `${wS > 0 ? `${wS} giây` : "0 giây"}`;

	return (
		<div
			ref={containerRef}
			className="relative flex min-h-screen flex-col overflow-hidden bg-background"
			style={isFullscreen ? { background: "#0a0a0a" } : undefined}
		>
			{/* Warning / finished pulse overlays */}
			<AnimatePresence>
				{(isWarning || isFinished) && (
					<>
						{/* Layer 1: Edge vignette — red border glow around entire screen */}
						<motion.div
							key="warn-vignette"
							className="pointer-events-none absolute inset-0 z-0 rounded-[inherit]"
							initial={{ opacity: 0 }}
							animate={{ opacity: [0, 1, 0] }}
							exit={{ opacity: 0, transition: { duration: 0.4 } }}
							transition={{
								duration: isFinished ? 0.55 : 1.4,
								repeat: Infinity,
								ease: "easeInOut",
							}}
							style={{
								boxShadow: isFinished
									? "inset 0 0 220px rgba(239,68,68,0.75)"
									: "inset 0 0 180px rgba(239,68,68,0.55)",
							}}
						/>
						{/* Layer 2: Center radial glow — offset phase for layered feel */}
						<motion.div
							key="warn-center"
							className="pointer-events-none absolute inset-0 z-0"
							initial={{ opacity: 0 }}
							animate={{ opacity: [0, 0.28, 0] }}
							exit={{ opacity: 0, transition: { duration: 0.4 } }}
							transition={{
								duration: isFinished ? 0.55 : 1.4,
								repeat: Infinity,
								ease: "easeInOut",
								delay: 0.15,
							}}
							style={{
								background:
									"radial-gradient(ellipse at 50% 45%, #ef4444 0%, transparent 62%)",
							}}
						/>
						{/* Layer 3: Full-screen tint — background color shift */}
						<motion.div
							key="warn-tint"
							className="pointer-events-none absolute inset-0 z-0"
							initial={{ opacity: 0 }}
							animate={{ opacity: [0, 0.1, 0] }}
							exit={{ opacity: 0, transition: { duration: 0.4 } }}
							transition={{
								duration: isFinished ? 0.55 : 1.4,
								repeat: Infinity,
								ease: "easeInOut",
								delay: 0.05,
							}}
							style={{ background: "#ef4444" }}
						/>
					</>
				)}
			</AnimatePresence>

			{/* Breadcrumb header (hidden in fullscreen) */}
			{!isFullscreen && (
				<div className="relative z-10 flex items-center gap-3 border-b border-border px-6 py-4">
					<Link
						href="/admin/tools"
						className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
					>
						<Icons.Back />
						Công cụ
					</Link>
					<span className="text-muted/40">/</span>
					<span className="text-sm font-bold text-foreground">Đồng hồ đếm ngược</span>
				</div>
			)}

			{/* Main content area */}
			<div
				className={`relative z-10 flex flex-1 items-center justify-center ${
					isFullscreen ? "p-6" : "p-8"
				}`}
			>
				<AnimatePresence mode="wait">
					{/* ── Settings panel ── */}
					{mode === "settings" && (
						<motion.div
							key="settings"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -16 }}
							transition={{ duration: 0.28 }}
							className="w-full max-w-md"
						>
							<div className="space-y-7 rounded-2xl border border-border bg-surface p-8">
								{/* Title */}
								<div className="text-center">
									<p className="text-[10px] font-bold uppercase tracking-widest text-muted">
										Admin Tool
									</p>
									<h1 className="mt-1 text-2xl font-black text-foreground">
										⏱ Đồng hồ đếm ngược
									</h1>
									<p className="mt-1 text-sm text-muted">Cài thời gian và bắt đầu đếm ngược</p>
								</div>

								{/* Duration inputs */}
								<div>
									<p className="mb-4 text-center text-sm font-bold text-foreground">
										Thời gian đếm ngược
									</p>
									<div className="flex items-end justify-center gap-3">
										<NumInput label="Giờ" value={sH} max={9} onChange={setSH} />
										<span className="pb-3.5 text-3xl font-black text-muted">:</span>
										<NumInput label="Phút" value={sM} max={59} onChange={setSM} />
										<span className="pb-3.5 text-3xl font-black text-muted">:</span>
										<NumInput label="Giây" value={sS} max={59} onChange={setSS} />
									</div>
								</div>

								{/* Quick presets */}
								<div className="flex flex-wrap justify-center gap-2">
									{(
										[
											[0, 1, 0, "1 phút"],
											[0, 3, 0, "3 phút"],
											[0, 5, 0, "5 phút"],
											[0, 10, 0, "10 phút"],
											[0, 15, 0, "15 phút"],
											[0, 30, 0, "30 phút"],
										] as [number, number, number, string][]
									).map(([ph, pm, ps, lbl]) => (
										<button
											key={lbl}
											onClick={() => {
												setSH(ph);
												setSM(pm);
												setSS(ps);
											}}
											className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-muted transition-colors hover:border-accent hover:text-accent"
										>
											{lbl}
										</button>
									))}
								</div>

								<div className="border-t border-border" />

								{/* Warning time */}
								<div>
									<div className="mb-4 flex items-center justify-center gap-2">
										<span className="inline-block h-2 w-2 rounded-full bg-red-500" />
										<p className="text-sm font-bold text-foreground">Cảnh báo sắp hết giờ</p>
									</div>
									<div className="flex items-end justify-center gap-3">
										<NumInput label="Phút" value={wM} max={59} onChange={setWM} />
										<span className="pb-3.5 text-3xl font-black text-muted">:</span>
										<NumInput label="Giây" value={wS} max={59} onChange={setWS} />
									</div>
									<p className="mt-3 text-center text-xs text-muted">
										Khi còn {warnLabel} → chữ đỏ + hiệu ứng cảnh báo
									</p>
									{/* Percentage presets */}
									<div className="mt-4 space-y-2">
										<p className="text-center text-[10px] font-bold uppercase tracking-widest text-muted">
											Gợi ý nhanh — cảnh báo khi đã qua
										</p>
										<div className="flex flex-wrap justify-center gap-2">
											{([50, 70, 80, 90] as const).map((pct) => {
												const total = sH * 3600 + sM * 60 + sS;
												const warnSecs = Math.round(total * (1 - pct / 100));
												const wLabel =
													warnSecs >= 60
														? `còn ${Math.floor(warnSecs / 60)}:${String(warnSecs % 60).padStart(2, "0")}`
														: `còn ${warnSecs}s`;
												return (
													<button
														key={pct}
														disabled={total === 0}
														onClick={() => {
															setWM(Math.floor(warnSecs / 60));
															setWS(warnSecs % 60);
														}}
														className="flex flex-col items-center rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-muted transition-colors hover:border-red-500/60 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
													>
														<span className="text-base font-black">{pct}%</span>
														{total > 0 && (
															<span className="mt-0.5 text-[10px] font-medium opacity-60">{wLabel}</span>
														)}
													</button>
												);
											})}
										</div>
									</div>
								</div>

								{/* Start button */}
								<button
									onClick={handleStart}
									disabled={sH === 0 && sM === 0 && sS === 0}
									className="w-full rounded-xl bg-accent py-3.5 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40"
								>
									Bắt đầu đếm ngược
								</button>
							</div>
						</motion.div>
					)}

					{/* ── Timer display ── */}
					{mode !== "settings" && (
						<motion.div
							key="timer"
							initial={{ opacity: 0, scale: 0.97 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.97 }}
							transition={{ duration: 0.28 }}
							className="flex w-full flex-col items-center gap-8"
						>
							{/* Progress bar (hidden in fullscreen) */}
							{!isFullscreen && (
								<div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-border">
									<motion.div
										className={`h-full rounded-full transition-colors duration-700 ${
											isWarning || isFinished ? "bg-red-500" : "bg-accent"
										}`}
										animate={{ width: `${Math.max(0, progress * 100)}%` }}
										transition={{ duration: 0.9, ease: "linear" }}
									/>
								</div>
							)}

							{/* Clock digits */}
							{isFinished ? (
								<motion.div
									className="flex flex-col items-center gap-4"
									animate={{ opacity: [1, 0.4, 1] }}
									transition={{ duration: 0.65, repeat: Infinity }}
								>
									<span
											className={isFullscreen ? "font-black leading-none text-red-300" : "font-black leading-none text-red-600"}
											style={{
												fontFamily: "var(--font-inter), system-ui, sans-serif",
												fontVariantNumeric: "tabular-nums",
												fontSize: clockSize,
												textShadow: isFullscreen ? "0 0 120px rgba(252,165,165,0.9)" : "none",
											}}
										>
											{zeroStr}
										</span>
										<span
											className={isFullscreen ? "font-black uppercase tracking-[0.25em] text-red-300" : "font-black uppercase tracking-[0.25em] text-red-500"}
											style={{
												fontSize: isFullscreen ? "clamp(1.5rem, 4vw, 3rem)" : "1.25rem",
											}}
										>
											Time&apos;s Up!
										</span>
									</motion.div>
								) : (
									<span
										className={`font-black leading-none transition-colors duration-500 ${
											isWarning
												? isFullscreen ? "text-red-300" : "text-red-600"
												: isFullscreen ? "text-white" : "text-foreground"
										}`}
										style={{
											fontFamily: "var(--font-inter), system-ui, sans-serif",
											fontVariantNumeric: "tabular-nums",
											fontSize: clockSize,
											textShadow:
												isWarning && isFullscreen
													? "0 0 120px rgba(252,165,165,0.9)"
													: "none",
										}}
									>
										{timeStr}
									</span>
								)}

							{/* Running status badge (hidden in fullscreen) */}
							{!isFullscreen && (
								<div className="flex items-center gap-2">
									<span
										className={`inline-block h-2 w-2 rounded-full ${
											isFinished
												? "bg-red-500"
												: mode === "running"
												? "animate-pulse bg-green-500"
												: "bg-amber-400"
										}`}
									/>
									<span className="text-xs font-bold uppercase tracking-wider text-muted">
										{isFinished ? "Time's Up" : mode === "running" ? "Đang chạy" : "Tạm dừng"}
									</span>
								</div>
							)}

							{/* Controls row */}
							<div
								className={`flex items-center gap-3 ${isFullscreen ? "absolute bottom-10" : ""}`}
							>
								{/* Pause / Resume */}
								{!isFinished && (
									<button
									onClick={handlePauseResume}
										className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-md ${
											mode === "running"
												? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
												: "bg-accent/15 text-accent hover:bg-accent/25"
										}`}
									>
										{mode === "running" ? <Icons.Pause /> : <Icons.Play />}
										<span>{mode === "running" ? "Tạm dừng" : "Tiếp tục"}</span>
									</button>
								)}

								{/* Reset → back to settings */}
								<button
									onClick={handleReset}
									className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-bold text-muted transition-all hover:-translate-y-0.5 hover:border-border-hover hover:text-foreground"
								>
									<Icons.Reset />
									<span>Đặt lại</span>
								</button>

								{/* Fullscreen toggle */}
								<button
									onClick={toggleFullscreen}
									title={
										isFullscreen ? "Thoát toàn màn hình (ESC)" : "Phóng to toàn màn hình (F)"
									}
									className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-bold text-muted transition-all hover:-translate-y-0.5 hover:border-border-hover hover:text-foreground"
								>
									{isFullscreen ? <Icons.Compress /> : <Icons.Expand />}
									{!isFullscreen && <span>Toàn màn hình</span>}
								</button>
							</div>

							{/* Keyboard hint (fullscreen only) */}
							{isFullscreen && (
								<p className="absolute bottom-4 text-[11px] uppercase tracking-widest text-white/25">
									Space · tạm dừng &nbsp;|&nbsp; F · fullscreen &nbsp;|&nbsp; R · đặt lại
								</p>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
