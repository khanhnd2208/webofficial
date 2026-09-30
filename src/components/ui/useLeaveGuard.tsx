'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';

type LeaveGuard = { dirty: () => boolean; save: () => Promise<boolean>; bypass: () => void };
const guards = new Set<LeaveGuard>();
async function saveAll() {
	for (const guard of [...guards].filter((item) => item.dirty())) {
		if (!(await guard.save())) return false;
	}
	return true;
}
function leavePage(href: string) {
	for (const guard of guards) guard.bypass();
	window.location.assign(href);
}

/** Capture links before Next handles them, including a workspace's own tabs. */
export function useLeaveGuard({
	dirty,
	save,
	autoSave = false,
	buttonClassName = 'mc-button min-h-11',
	primaryButtonClassName = 'mc-button mc-button-primary min-h-11',
}: {
	dirty: () => boolean;
	save: () => Promise<boolean>;
	autoSave?: boolean;
	buttonClassName?: string;
	primaryButtonClassName?: string;
}) {
	const [destination, setDestination] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [failed, setFailed] = useState(false);
	const bypass = useRef(false);
	const running = useRef(false);
	useEffect(() => {
		const guard = {
			dirty,
			save,
			bypass: () => {
				bypass.current = true;
			},
		};
		guards.add(guard);
		const currentHref = window.location.href;
		const currentState = window.history.state;
		const leave = (href: string) => {
			leavePage(href);
		};
		const click = (event: MouseEvent) => {
			if (
				bypass.current ||
				!dirty() ||
				event.button !== 0 ||
				event.metaKey ||
				event.ctrlKey ||
				event.shiftKey ||
				event.altKey
			)
				return;
			const link = (event.target as Element)?.closest?.('a[href]') as HTMLAnchorElement | null;
			if (
				!link ||
				link.target === '_blank' ||
				link.hasAttribute('download') ||
				link.pathname.includes('/api/')
			)
				return;
			const current = new URL(window.location.href);
			if (
				link.origin === current.origin &&
				link.pathname === current.pathname &&
				link.search === current.search
			)
				return;
			event.preventDefault();
			event.stopImmediatePropagation();
			if (running.current) return;
			if (!autoSave) {
				setDestination(link.href);
				setFailed(false);
				return;
			}
			running.current = true;
			void saveAll()
				.then((ok) => {
					if (ok) leave(link.href);
					else {
						setDestination(link.href);
						setFailed(true);
					}
				})
				.catch(() => {
					setDestination(link.href);
					setFailed(true);
				})
				.finally(() => {
					running.current = false;
				});
		};
		const unload = (event: BeforeUnloadEvent) => {
			if (bypass.current || !dirty()) return;
			event.preventDefault();
			event.returnValue = '';
		};
		const back = (event: PopStateEvent) => {
			if (bypass.current || !dirty()) return;
			const target = window.location.href;
			if (target === currentHref) return;
			event.stopImmediatePropagation();
			window.history.pushState(currentState, '', currentHref);
			setDestination(target);
			setFailed(false);
		};
		document.addEventListener('click', click, true);
		window.addEventListener('popstate', back, true);
		window.addEventListener('beforeunload', unload);
		return () => {
			guards.delete(guard);
			document.removeEventListener('click', click, true);
			window.removeEventListener('popstate', back, true);
			window.removeEventListener('beforeunload', unload);
		};
	}, [dirty, save, autoSave]);

	return (
		<Dialog
			open={destination !== null}
			title="Thay đổi chưa lưu"
			onClose={() => {
				if (!saving) setDestination(null);
			}}
		>
			<div className="space-y-4">
				<p className="text-sm" role={failed ? 'alert' : undefined}>
					{failed
						? 'Chưa lưu được thay đổi. Nội dung vẫn được giữ lại; hãy thử lưu lại hoặc ở lại để chỉnh sửa.'
						: 'Lưu thay đổi trước khi rời trang?'}
				</p>
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						className={buttonClassName}
						disabled={saving}
						onClick={() => setDestination(null)}
					>
						Ở lại
					</button>
					<button
						type="button"
						className={buttonClassName}
						disabled={saving}
						onClick={() => leavePage(destination!)}
					>
						Bỏ thay đổi
					</button>
					<button
						type="button"
						className={primaryButtonClassName}
						disabled={saving}
						onClick={async () => {
							setSaving(true);
							try {
								if (await saveAll()) leavePage(destination!);
								else setFailed(true);
							} catch {
								setFailed(true);
							} finally {
								setSaving(false);
							}
						}}
					>
						{saving ? 'Đang lưu…' : failed ? 'Thử lại' : 'Lưu và rời trang'}
					</button>
				</div>
			</div>
		</Dialog>
	);
}
