'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
	type CSSProperties,
	type MouseEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import RecentClasses from '@/components/site/RecentClasses';
import styles from './toc.module.css';

export interface TocDoor {
	href: string;
	label: string;
	description: string;
	icon: string;
}

export interface TocSpaceItem extends TocDoor {
	id: string;
	accentClass?: string;
}

const SPACE_HASH = '#my-space';
const PANEL_ID = 'toc-myspace-panel';

function Arrow() {
	return (
		<span className={styles.arrow} aria-hidden="true">
			↗
		</span>
	);
}

/**
 * Mục lục doors: "Về tôi" goes straight to the about page; "My Space" opens in place and its
 * spaces fan out from the stacked icons. The open state lives in `#my-space`, so Back closes it
 * and the link can be shared. Without JavaScript the My Space door is a plain link to /my-space.
 */
export default function TocDoors({
	about,
	space,
	items,
}: {
	about: TocDoor;
	space: Omit<TocDoor, 'icon'>;
	items: TocSpaceItem[];
}) {
	const [open, setOpen] = useState(false);
	// True while the open state is a history entry we pushed, so closing can step back over it.
	const pushed = useRef(false);
	const focusAfter = useRef<'panel' | 'trigger' | null>(null);
	const triggerRef = useRef<HTMLAnchorElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const sync = () => {
			const next = window.location.hash === SPACE_HASH;
			if (!next) pushed.current = false;
			setOpen(next);
		};
		sync();
		window.addEventListener('hashchange', sync);
		window.addEventListener('popstate', sync);
		return () => {
			window.removeEventListener('hashchange', sync);
			window.removeEventListener('popstate', sync);
		};
	}, []);

	const close = useCallback(() => {
		focusAfter.current = 'trigger';
		if (pushed.current) {
			window.history.back();
			return;
		}
		const { pathname, search } = window.location;
		window.history.replaceState(null, '', `${pathname}${search}`);
		setOpen(false);
	}, []);

	useEffect(() => {
		if (focusAfter.current === 'panel' && open) {
			panelRef.current?.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
		} else if (focusAfter.current === 'trigger' && !open) {
			triggerRef.current?.focus({ preventScroll: true });
		}
		focusAfter.current = null;
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') close();
		};
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [open, close]);

	const onTrigger = (event: MouseEvent<HTMLAnchorElement>) => {
		// Let modified clicks open /my-space in a new tab as a normal link would.
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
			return;
		}
		event.preventDefault();
		if (open) {
			close();
			return;
		}
		focusAfter.current = 'panel';
		pushed.current = true;
		window.history.pushState(null, '', SPACE_HASH);
		setOpen(true);
	};

	const stack = items.slice(0, 3);

	return (
		<nav
			aria-label="Về tôi và My Space"
			className={styles.navigation}
			data-open={open ? '' : undefined}
		>
			<Link href={about.href} className={styles.aboutDoor} data-testid="gate-item-about">
				<span className={styles.doorEyebrow}>About me</span>
				<span className={styles.doorIcon}>
					<Image
						src={about.icon}
						alt=""
						width={112}
						height={112}
						sizes="(max-width: 760px) 64px, 112px"
					/>
				</span>
				<span className={styles.doorText}>
					<span className={styles.doorTitle}>
						{about.label}
						<Arrow />
					</span>
					<span className={styles.doorDescription}>{about.description}</span>
				</span>
			</Link>

			<section className={styles.spaceDoor} aria-labelledby="toc-myspace">
				<div className={styles.triggerRow}>
					<a
						ref={triggerRef}
						href={space.href}
						onClick={onTrigger}
						className={styles.trigger}
						aria-expanded={open}
						aria-controls={PANEL_ID}
						data-testid="toc-open-myspace"
					>
						<span className={styles.doorEyebrow}>Học · Dạy · Chơi</span>
						<span className={styles.stack} aria-hidden="true">
							{stack.map((item, index) => (
								<span
									key={item.id}
									className={styles.stackCard}
									style={{ '--offset': index - (stack.length - 1) / 2 } as CSSProperties}
								>
									<Image src={item.icon} alt="" width={88} height={88} sizes="88px" />
								</span>
							))}
						</span>
						<span className={styles.doorText}>
							<span className={styles.doorTitle} id="toc-myspace">
								{space.label}
								<span className={styles.chevron} aria-hidden="true">
									⌄
								</span>
							</span>
							<span className={styles.doorDescription}>{space.description}</span>
						</span>
					</a>
				</div>

				<div className={styles.panelRow}>
					<div
						ref={panelRef}
						id={PANEL_ID}
						className={styles.panel}
						inert={!open}
						aria-hidden={!open}
					>
						<div className={styles.panelHead}>
							<p className={styles.panelTitle}>
								{space.label}
								<span>Học · Dạy · Chơi</span>
							</p>
							<button
								type="button"
								onClick={close}
								className={styles.close}
								aria-label="Thu gọn My Space"
								data-testid="toc-close-myspace"
							>
								<span aria-hidden="true">✕</span>
							</button>
						</div>
						<ul
							className={styles.grid}
							// Tiles converge on the middle column while hidden, so they look like they fan out.
							style={{ '--mid': (Math.min(items.length, 4) - 1) / 2 } as CSSProperties}
						>
							{items.map((item, index) => (
								<li key={item.id} style={{ '--i': index } as CSSProperties}>
									<Link
										href={item.href}
										className={`${styles.tile} ${item.accentClass ?? ''}`}
										data-testid={`myspace-tile-${item.id}`}
									>
										<span className={styles.icon}>
											<Image
												src={item.icon}
												alt=""
												width={112}
												height={112}
												sizes="(max-width: 760px) 44px, 96px"
											/>
										</span>
										<span className={styles.tileText}>
											<span className={styles.tileTitle}>
												{item.label}
												<Arrow />
											</span>
											<span className={styles.description}>{item.description}</span>
										</span>
									</Link>
								</li>
							))}
						</ul>
						<RecentClasses className={styles.recent} />
					</div>
				</div>
			</section>
		</nav>
	);
}
