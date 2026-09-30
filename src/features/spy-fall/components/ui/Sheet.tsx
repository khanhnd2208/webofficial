'use client';

import { useEffect, useRef } from 'react';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { cn } from '@/features/spy-fall/lib/cn';

interface SheetProps {
	open: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	className?: string;
}

const FOCUSABLE_SELECTOR =
	'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function Sheet({ open, onClose, title, children, className }: SheetProps) {
	const t = useT();
	const panelRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<Element | null>(null);
	const onCloseRef = useRef(onClose);

	useEffect(() => {
		onCloseRef.current = onClose;
	}, [onClose]);

	useEffect(() => {
		if (!open) return;

		triggerRef.current = document.activeElement;

		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onCloseRef.current();
		};
		document.addEventListener('keydown', onKey);
		document.body.style.overflow = 'hidden';

		const focusable = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
		focusable?.focus({ preventScroll: true });

		return () => {
			document.removeEventListener('keydown', onKey);
			document.body.style.overflow = '';
			if (triggerRef.current instanceof HTMLElement) {
				triggerRef.current.focus({ preventScroll: true });
			}
		};
	}, [open]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
			role="dialog"
			aria-modal="true"
			aria-labelledby="sheet-title"
		>
			<button
				type="button"
				className="absolute inset-0 bg-[var(--overlay)]"
				onClick={onClose}
				aria-label={t('common.close')}
			/>
			<div
				ref={panelRef}
				className={cn(
					'relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-surface-elevated p-6 shadow-lg animate-fade-in sm:rounded-2xl',
					className,
				)}
			>
				<div className="mb-4 flex items-center justify-between gap-4">
					<h2 id="sheet-title" className="font-display text-lg font-semibold text-ink">
						{title}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="flex h-10 w-10 items-center justify-center rounded-full text-2xl text-muted hover:bg-surface-hover"
						aria-label={t('common.close')}
					>
						×
					</button>
				</div>
				{children}
			</div>
		</div>
	);
}
