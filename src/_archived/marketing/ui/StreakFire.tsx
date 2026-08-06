'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface StreakData {
	currentStreak: number;
	longestStreak: number;
	lastLoginDate: string;
	recentDays: string[];
}

/**
 * Streak tier badge — custom SVG icon for each tier level.
 * These replace basic emoji with stylized, gradient-filled icons.
 */
function TierBadge({ tier, size = 14 }: { tier: number; size?: number }) {
	if (tier >= 6) {
		// Crown — Huyền thoại
		return (
			<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
				<defs>
					<linearGradient id="crown-grad" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stopColor="#ff00cc" />
						<stop offset="50%" stopColor="#ffcc00" />
						<stop offset="100%" stopColor="#ff00cc" />
					</linearGradient>
				</defs>
				<path d="M2.5 19h19l-2-11-4.5 4L12 5l-3 7L4.5 8l-2 11z" fill="url(#crown-grad)" />
				<rect x="2.5" y="19" width="19" height="2.5" rx="1" fill="url(#crown-grad)" opacity="0.7" />
				<circle cx="12" cy="5" r="1.5" fill="#fff" opacity="0.9" />
				<circle cx="4.5" cy="8" r="1" fill="#fff" opacity="0.7" />
				<circle cx="19.5" cy="8" r="1" fill="#fff" opacity="0.7" />
			</svg>
		);
	}
	if (tier >= 5) {
		// Diamond — Bất diệt
		return (
			<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
				<defs>
					<linearGradient id="diamond-grad" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stopColor="#ff3300" />
						<stop offset="50%" stopColor="#ffcc00" />
						<stop offset="100%" stopColor="#ff3300" />
					</linearGradient>
				</defs>
				<path d="M12 2L2 9l10 13L22 9 12 2z" fill="url(#diamond-grad)" />
				<path d="M7 9h10L12 22 7 9z" fill="#fff" opacity="0.25" />
				<path d="M12 2L7 9h10L12 2z" fill="#fff" opacity="0.15" />
			</svg>
		);
	}
	if (tier >= 4) {
		// Volcano — Bùng cháy
		return (
			<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
				<defs>
					<linearGradient id="volcano-grad" x1="0.5" y1="0" x2="0.5" y2="1">
						<stop offset="0%" stopColor="#ffaa00" />
						<stop offset="100%" stopColor="#ff4400" />
					</linearGradient>
				</defs>
				<path d="M3 22L8 12l2 3 2-7 2 7 2-3 5 10H3z" fill="url(#volcano-grad)" />
				<path d="M10 6l2-4 2 4" stroke="#ffcc00" strokeWidth="1.5" strokeLinecap="round" fill="none" />
				<circle cx="8" cy="5" r="0.8" fill="#ff6600" opacity="0.8" />
				<circle cx="16" cy="4" r="0.6" fill="#ffaa00" opacity="0.7" />
			</svg>
		);
	}
	if (tier >= 3) {
		// Intense flame — Rực lửa
		return (
			<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
				<defs>
					<linearGradient id="flame3-grad" x1="0.5" y1="1" x2="0.5" y2="0">
						<stop offset="0%" stopColor="#ff5500" />
						<stop offset="60%" stopColor="#ff8800" />
						<stop offset="100%" stopColor="#ffbb33" />
					</linearGradient>
				</defs>
				<path d="M12 1C9 6 4 10 4 16c0 5 3.5 7 8 7s8-2 8-7c0-6-5-10-8-15z" fill="url(#flame3-grad)" />
				<path d="M12 10c-2 3-4 5-4 8 0 2.5 1.8 4 4 4s4-1.5 4-4c0-3-2-5-4-8z" fill="#ffcc66" opacity="0.6" />
				<ellipse cx="12" cy="18" rx="2" ry="3" fill="#fff" opacity="0.3" />
			</svg>
		);
	}
	if (tier >= 2) {
		// Warm flame — Ấm nóng
		return (
			<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
				<defs>
					<linearGradient id="flame2-grad" x1="0.5" y1="1" x2="0.5" y2="0">
						<stop offset="0%" stopColor="#ff7700" />
						<stop offset="100%" stopColor="#ffcc66" />
					</linearGradient>
				</defs>
				<path d="M12 2C9.5 7 5 11 5 16c0 4.5 3 7 7 7s7-2.5 7-7c0-5-4.5-9-7-14z" fill="url(#flame2-grad)" />
				<path d="M12 12c-1.5 2.5-3 4-3 6.5 0 2 1.3 3 3 3s3-1 3-3c0-2.5-1.5-4-3-6.5z" fill="#ffdd99" opacity="0.5" />
			</svg>
		);
	}
	if (tier >= 1) {
		// Spark — Bắt đầu
		return (
			<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
				<defs>
					<linearGradient id="spark-grad" x1="0.5" y1="1" x2="0.5" y2="0">
						<stop offset="0%" stopColor="#ffaa44" />
						<stop offset="100%" stopColor="#ffdd99" />
					</linearGradient>
				</defs>
				<path d="M12 2l2.5 6.5L21 12l-6.5 2.5L12 22l-2.5-7.5L3 12l6.5-3.5L12 2z" fill="url(#spark-grad)" />
				<circle cx="12" cy="12" r="3" fill="#fff" opacity="0.4" />
			</svg>
		);
	}
	// No streak — moon/sleep
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" fill="#9e9889" opacity="0.5" />
			<circle cx="9" cy="10" r="0.8" fill="#7a7568" />
			<path d="M8 14.5c1 1 3 1 4 0" stroke="#7a7568" strokeWidth="1" strokeLinecap="round" fill="none" />
		</svg>
	);
}

/**
 * Streak tiers — the fire evolves as the streak grows.
 * Each tier has a name, min streak, and gradient colors.
 */
function getStreakTier(streak: number) {
	if (streak >= 100) return { name: 'Huyền thoại', tier: 6, colors: ['#ff00cc', '#ff6600', '#ffff00', '#ff00cc'], glow: '#ff00cc', bg: 'from-purple-subtle to-rose-subtle' };
	if (streak >= 60) return { name: 'Bất diệt', tier: 5, colors: ['#ff3300', '#ff6600', '#ffcc00', '#ff3300'], glow: '#ff3300', bg: 'from-rose-subtle to-accent-subtle' };
	if (streak >= 30) return { name: 'Bùng cháy', tier: 4, colors: ['#ff4400', '#ff7700', '#ffaa00'], glow: '#ff5500', bg: 'from-accent-subtle to-warning-subtle' };
	if (streak >= 14) return { name: 'Rực lửa', tier: 3, colors: ['#ff5500', '#ff8800', '#ffbb33'], glow: '#ff7700', bg: 'from-accent-subtle to-warning-subtle' };
	if (streak >= 7) return { name: 'Ấm nóng', tier: 2, colors: ['#ff7700', '#ffaa44', '#ffcc66'], glow: '#ff9933', bg: 'from-warning-subtle to-accent-subtle' };
	if (streak >= 2) return { name: 'Bắt đầu', tier: 1, colors: ['#ffaa44', '#ffcc77', '#ffdd99'], glow: '#ffbb55', bg: 'from-warning-subtle to-surface' };
	return { name: '', tier: 0, colors: ['#ccc', '#ddd'], glow: '#999', bg: '' };
}

export default function StreakFire() {
	const { data: session } = useSession();
	const [streak, setStreak] = useState<StreakData | null>(null);
	const [recorded, setRecorded] = useState(false);

	useEffect(() => {
		if (!session?.user || recorded) return;
		let cancelled = false;

		// Record login and get streak data
		fetch('/api/streak', { method: 'POST' })
			.then((r) => r.json())
			.then((j) => {
				if (!cancelled && j.ok) {
					setStreak(j.data);
					setRecorded(true);
				}
			})
			.catch(() => {});

		return () => { cancelled = true; };
	}, [session, recorded]);

	if (!streak) {
		// Loading state
		return (
			<div className="flex flex-col items-center gap-2">
				<div className="h-16 w-16 animate-pulse rounded-full bg-surface-hover sm:h-20 sm:w-20" />
				<div className="h-4 w-12 animate-pulse rounded bg-surface-hover" />
			</div>
		);
	}

	if (streak.currentStreak < 1) {
		return (
			<div className="flex flex-col items-center gap-2 text-center">
				<TierBadge tier={0} size={36} />
				<div className="text-[10px] font-bold uppercase tracking-widest text-muted">
					Chưa có chuỗi
				</div>
			</div>
		);
	}

	const tier = getStreakTier(streak.currentStreak);

	return (
		<div className="flex flex-col items-center gap-3">
			{/* Animated fire */}
			<div className="relative flex items-center justify-center">
				{/* Outer glow */}
				{tier.tier >= 2 && (
					<div
						className="absolute inset-0 animate-pulse rounded-full blur-xl"
						style={{
							background: `radial-gradient(circle, ${tier.glow}40 0%, transparent 70%)`,
							transform: `scale(${1 + tier.tier * 0.3})`,
						}}
					/>
				)}

				{/* Fire SVG */}
				<div className="relative">
					<svg
						viewBox="0 0 64 64"
						className="h-16 w-16 drop-shadow-lg sm:h-20 sm:w-20"
						style={{
							filter: tier.tier >= 3 ? `drop-shadow(0 0 ${4 + tier.tier * 2}px ${tier.glow})` : undefined,
						}}
					>
						<defs>
							<linearGradient id={`fire-grad-${tier.tier}`} x1="0" y1="1" x2="0" y2="0">
								{tier.colors.map((c, i) => (
									<stop key={i} offset={`${(i / (tier.colors.length - 1)) * 100}%`} stopColor={c} />
								))}
							</linearGradient>
						</defs>

						{/* Main flame */}
						<path
							d="M32 4 C24 16, 12 24, 12 38 C12 50, 20 60, 32 60 C44 60, 52 50, 52 38 C52 24, 40 16, 32 4Z"
							fill={`url(#fire-grad-${tier.tier})`}
							className={tier.tier >= 2 ? 'animate-flame' : ''}
						/>

						{/* Inner flame — brighter */}
						<path
							d="M32 20 C28 28, 22 32, 22 42 C22 50, 26 56, 32 56 C38 56, 42 50, 42 42 C42 32, 36 28, 32 20Z"
							fill={tier.colors[Math.min(1, tier.colors.length - 1)]}
							opacity={0.7}
							className={tier.tier >= 3 ? 'animate-flame-inner' : ''}
						/>

						{/* Core — hottest */}
						{tier.tier >= 3 && (
							<path
								d="M32 34 C30 38, 27 40, 27 46 C27 50, 29 54, 32 54 C35 54, 37 50, 37 46 C37 40, 34 38, 32 34Z"
								fill="#fff8"
								className="animate-flame-core"
							/>
						)}
					</svg>

					{/* Sparkle particles for tier 4+ */}
					{tier.tier >= 4 && (
						<>
							<span className="absolute -top-1 left-1/2 h-1 w-1 animate-sparkle rounded-full bg-yellow-300" style={{ animationDelay: '0s' }} />
							<span className="absolute -top-2 left-1/3 h-1 w-1 animate-sparkle rounded-full bg-orange-400" style={{ animationDelay: '0.4s' }} />
							<span className="absolute -top-1 left-2/3 h-1 w-1 animate-sparkle rounded-full bg-red-400" style={{ animationDelay: '0.8s' }} />
						</>
					)}

					{/* Crown for tier 6 */}
					{tier.tier >= 6 && (
						<span className="absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce" style={{ animationDuration: '2s' }}>
							<TierBadge tier={6} size={22} />
						</span>
					)}
				</div>
			</div>

			{/* Streak number */}
			<div className="text-center">
				<div className="text-3xl font-black tabular-nums tracking-tight text-foreground sm:text-4xl">
					{streak.currentStreak}
				</div>
				<div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted">
					{streak.currentStreak === 1 ? 'ngày' : 'ngày liên tiếp'}
				</div>
				{tier.tier >= 1 && (
					<div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: tier.glow }}>
						<TierBadge tier={tier.tier} size={12} /> {tier.name}
					</div>
				)}
			</div>

			{/* Longest streak */}
			{streak.longestStreak > streak.currentStreak && (
				<div className="text-[10px] text-muted">
					Kỷ lục: <span className="font-bold text-foreground-secondary">{streak.longestStreak} ngày</span>
				</div>
			)}
		</div>
	);
}
