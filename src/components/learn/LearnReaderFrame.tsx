'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';

import { LearnIcon } from './LearnIcon';
import { LearnScrollProgress } from './LearnPlayerChrome';
import { useLearnFontSize } from './LearnReaderPrefs';

const COLLAPSED_KEY = 'ln:outline-collapsed';
const COLLAPSED_EVENT = 'ln:outline-collapsed';

function readCollapsed(): boolean {
	try {
		return window.localStorage.getItem(COLLAPSED_KEY) === '1';
	} catch {
		return false;
	}
}

function subscribeCollapsed(onChange: () => void) {
	window.addEventListener('storage', onChange);
	window.addEventListener(COLLAPSED_EVENT, onChange);
	return () => {
		window.removeEventListener('storage', onChange);
		window.removeEventListener(COLLAPSED_EVENT, onChange);
	};
}

/**
 * Course player: a thin top bar, a curriculum sidebar (collapsible on desktop, a
 * dialog drawer on mobile) and the measure-limited article.
 */
export default function LearnReaderFrame({
	header,
	outlineHead,
	outline,
	children,
}: {
	header: ReactNode;
	outlineHead?: ReactNode;
	outline: ReactNode;
	children: ReactNode;
}) {
	const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
	const fontSize = useLearnFontSize();
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [desktop, setDesktop] = useState(false);
	const toggleRef = useRef<HTMLButtonElement>(null);
	const wasOpen = useRef(false);

	useEffect(() => {
		const media = window.matchMedia('(min-width: 64rem)');
		const sync = () => setDesktop(media.matches);
		sync();
		media.addEventListener('change', sync);
		return () => media.removeEventListener('change', sync);
	}, []);

	useEffect(() => {
		if (wasOpen.current && !drawerOpen) toggleRef.current?.focus();
		wasOpen.current = drawerOpen;
	}, [drawerOpen]);

	useEffect(() => {
		if (!drawerOpen) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setDrawerOpen(false);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [drawerOpen]);

	function toggleCollapsed() {
		try {
			window.localStorage.setItem(COLLAPSED_KEY, collapsed ? '0' : '1');
		} catch {
			/* storage unavailable */
		}
		window.dispatchEvent(new Event(COLLAPSED_EVENT));
	}

	const outlineVisible = desktop ? !collapsed : drawerOpen;
	const drawer = !desktop && drawerOpen;

	return (
		<div className="ln-frame" data-collapsed={collapsed ? 'true' : undefined} data-size={fontSize}>
			<header className="ln-topbar">
				<button
					ref={toggleRef}
					type="button"
					className="ln-icon-btn ln-topbar__outline-toggle"
					onClick={() => (desktop ? toggleCollapsed() : setDrawerOpen(true))}
					aria-label={outlineVisible ? 'Ẩn mục lục' : 'Hiện mục lục'}
					aria-expanded={outlineVisible}
					title="Mục lục · ← → chuyển mục · O về trang khóa học"
				>
					<LearnIcon name="sidebar" size={18} strokeWidth={1.6} />
				</button>
				{header}
				<LearnScrollProgress />
			</header>
			<div className="ln-frame__body">
				<aside
					className="ln-frame__outline"
					data-open={drawerOpen ? 'true' : undefined}
					role={drawer ? 'dialog' : undefined}
					aria-modal={drawer ? true : undefined}
					aria-label="Nội dung khóa học"
					inert={!outlineVisible ? true : undefined}
					onClick={(event) => {
						if ((event.target as HTMLElement).closest('a')) setDrawerOpen(false);
					}}
				>
					<div className="ln-frame__drawer-head">
						<span>Nội dung khóa học</span>
						<button
							type="button"
							className="ln-icon-btn"
							onClick={() => setDrawerOpen(false)}
							aria-label="Đóng mục lục"
						>
							<LearnIcon name="close" size={16} />
						</button>
					</div>
					{outlineHead}
					<div className="ln-frame__outline-scroll">{outline}</div>
				</aside>
				{drawerOpen ? (
					<button
						type="button"
						className="ln-frame__scrim"
						aria-label="Đóng mục lục"
						onClick={() => setDrawerOpen(false)}
					/>
				) : null}
				<main className="ln-frame__main">{children}</main>
			</div>
		</div>
	);
}
