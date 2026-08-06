'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { useMotionTier } from '@/components/motion/MotionProvider';
import { duration, gateTimeline } from '@/components/motion/tokens';
import { GATE_NAV_ITEMS, isGateItemLocked } from '@/config/navigation';

function LockIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			width="12"
			height="12"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<rect x="5" y="11" width="14" height="10" rx="1.5" />
			<path d="M8 11V8a4 4 0 0 1 8 0v3" />
		</svg>
	);
}

function formatIndex(index: number): string {
	return String(index + 1).padStart(2, '0');
}

/**
 * Mục lục gate — typographic table of contents.
 * Hover dims siblings and reveals a soft blurb; selecting exits gently then navigates.
 * Locked items reveal a short note in place (no navigation).
 * Published items stay real links so the gate works without JavaScript.
 */
export default function GateNav() {
	const router = useRouter();
	const { tier } = useMotionTier();
	const [exitingId, setExitingId] = useState<string | null>(null);
	const [lockedOpenId, setLockedOpenId] = useState<string | null>(null);
	const [hoveredId, setHoveredId] = useState<string | null>(null);

	const reduceMotion = tier === 'reduced';
	const exitMs = reduceMotion
		? 0
		: Math.round((tier === 'lite' ? duration.gate * 0.7 : duration.gate) * 1000);

	const navigate = useCallback(
		(event: React.MouseEvent<HTMLAnchorElement>, id: string, href: string) => {
			if (exitingId) {
				event.preventDefault();
				return;
			}
			if (exitMs === 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
				return;
			}
			event.preventDefault();
			setExitingId(id);
			window.setTimeout(() => {
				router.push(href);
			}, exitMs);
		},
		[exitMs, exitingId, router],
	);

	return (
		<nav aria-label="Cổng trang" className="w-full max-w-md">
			<ul
				className={`group/gate flex flex-col items-stretch gap-1 ${exitingId ? 'pointer-events-none' : ''}`}
			>
				{GATE_NAV_ITEMS.map((item, index) => {
					const locked = isGateItemLocked(item);
					const isExiting = exitingId === item.id;
					const isFading = exitingId !== null && exitingId !== item.id;
					const isHovered = hoveredId === item.id;
					const lockedOpen = lockedOpenId === item.id;
					const showBlurb = (isHovered || lockedOpen) && item.blurb && !exitingId;

					const delayStyle = reduceMotion
						? undefined
						: {
								animationDelay: `${gateTimeline.itemBase + index * gateTimeline.itemStep}s`,
							};

					if (locked || !item.href) {
						return (
							<li
								key={item.id}
								className={`gate-item-enter flex flex-col items-center ${isFading ? 'gate-item-exit-fade' : ''}`}
								style={delayStyle}
							>
								<button
									type="button"
									className="group/item flex min-h-14 w-full cursor-not-allowed flex-col items-center justify-center gap-1 px-4 py-3 text-ink/35 transition-[opacity,color,transform] duration-[var(--motion-gate)] ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-ink/45 focus-visible:text-ink/45 focus-visible:outline-none"
									aria-expanded={lockedOpen}
									aria-disabled="true"
									data-testid="gate-item-locked"
									onClick={() =>
										setLockedOpenId((current) => (current === item.id ? null : item.id))
									}
									onMouseEnter={() => setHoveredId(item.id)}
									onMouseLeave={() => setHoveredId(null)}
									onFocus={() => setHoveredId(item.id)}
									onBlur={() => setHoveredId(null)}
								>
									<span className="flex items-baseline gap-3">
										<span className="font-mono text-[0.6875rem] tracking-[0.14em] opacity-50">
											{formatIndex(index)}
										</span>
										<span className="font-mono text-[clamp(1.625rem,4.5vw,2.25rem)] font-medium tracking-[0.04em]">
											{item.label}
										</span>
										<LockIcon className="opacity-70" />
									</span>
									<span className="flex items-center gap-1.5 font-mono text-[0.625rem] tracking-[0.12em] text-ink/40 uppercase">
										Đang phát triển
									</span>
									<span className="sr-only"> — đang phát triển, chưa mở</span>
								</button>
								{lockedOpen ? (
									<p
										className="mt-1 max-w-[16rem] text-center text-[0.75rem] leading-relaxed text-ink/45"
										role="status"
										data-testid="gate-locked-note"
									>
										Không gian này đang được hoàn thiện.
									</p>
								) : null}
							</li>
						);
					}

					return (
						<li
							key={item.id}
							className={[
								'gate-item-enter transition-[opacity,transform] ease-[cubic-bezier(0.22,1,0.36,1)]',
								reduceMotion ? 'duration-0' : 'duration-[var(--motion-gate)]',
								isFading ? 'gate-item-exit-fade' : '',
								isExiting ? 'gate-item-exit-select' : '',
								!exitingId
									? 'opacity-100 group-hover/gate:opacity-40 hover:!opacity-100 focus-within:!opacity-100'
									: '',
							]
								.filter(Boolean)
								.join(' ')}
							style={delayStyle}
							onMouseEnter={() => setHoveredId(item.id)}
							onMouseLeave={() => setHoveredId(null)}
						>
							<Link
								href={item.href}
								className="group/item flex min-h-14 w-full cursor-pointer flex-col items-center justify-center gap-1.5 px-4 py-3 font-normal text-ink transition-[font-weight] duration-[var(--motion-gate)] ease-[cubic-bezier(0.22,1,0.36,1)] hover:font-medium focus-visible:font-medium focus-visible:outline-none"
								data-testid={`gate-item-${item.id}`}
								onClick={(event) => navigate(event, item.id, item.href!)}
								onFocus={() => setHoveredId(item.id)}
								onBlur={() => setHoveredId(null)}
							>
								<span className="flex items-baseline gap-3">
									<span className="font-mono text-[0.6875rem] tracking-[0.14em] text-ink/35 transition-colors group-hover/item:text-accent">
										{formatIndex(index)}
									</span>
									<span className="relative font-mono text-[clamp(1.625rem,4.5vw,2.25rem)] tracking-[0.04em]">
										{item.label}
										<span
											className={`gate-item-underline absolute -bottom-1 left-0 h-px w-full origin-left bg-accent ${
												isExiting ? 'gate-item-underline-draw' : ''
											}`}
											aria-hidden
										/>
									</span>
								</span>
								<span
									className={`max-w-[18rem] text-center font-sans text-[0.75rem] leading-relaxed tracking-normal text-ink/45 transition-[opacity,transform] duration-300 ${
										showBlurb && !lockedOpen
											? 'translate-y-0 opacity-100'
											: 'pointer-events-none -translate-y-1 opacity-0'
									}`}
									aria-hidden={!showBlurb}
								>
									{item.blurb}
								</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
