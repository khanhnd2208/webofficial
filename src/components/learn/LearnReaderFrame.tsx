'use client';

import { useState, useSyncExternalStore, type ReactNode } from 'react';

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
 * Two-column reader: sticky outline on the left (collapsible on desktop, a drawer on
 * mobile) and the measure-limited article on the right.
 */
export default function LearnReaderFrame({
	header,
	outline,
	children,
}: {
	header: ReactNode;
	outline: ReactNode;
	children: ReactNode;
}) {
	const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
	const [drawerOpen, setDrawerOpen] = useState(false);

	function toggleCollapsed() {
		try {
			window.localStorage.setItem(COLLAPSED_KEY, collapsed ? '0' : '1');
		} catch {
			/* storage unavailable */
		}
		window.dispatchEvent(new Event(COLLAPSED_EVENT));
	}

	return (
		<div className="ln-frame" data-collapsed={collapsed ? 'true' : undefined}>
			<header className="ln-topbar">
				<button
					type="button"
					className="ln-icon-btn ln-topbar__outline-toggle"
					onClick={() => (window.matchMedia('(min-width: 64rem)').matches ? toggleCollapsed() : setDrawerOpen(true))}
					aria-label={collapsed ? 'Hiện mục lục' : 'Mục lục'}
					title="Mục lục"
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
						<rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
						<path d="M9.5 4.5v15" />
					</svg>
				</button>
				{header}
			</header>
			<div className="ln-frame__body">
				<aside
					className="ln-frame__outline"
					data-open={drawerOpen ? 'true' : undefined}
					onClick={(event) => {
						if ((event.target as HTMLElement).closest('a')) setDrawerOpen(false);
					}}
				>
					<div className="ln-frame__drawer-head">
						<span>Mục lục</span>
						<button type="button" className="ln-icon-btn" onClick={() => setDrawerOpen(false)} aria-label="Đóng mục lục">
							×
						</button>
					</div>
					{outline}
				</aside>
				{drawerOpen ? <button type="button" className="ln-frame__scrim" aria-label="Đóng mục lục" onClick={() => setDrawerOpen(false)} /> : null}
				<main className="ln-frame__main">{children}</main>
			</div>
		</div>
	);
}
