'use client';

import { createContext, useCallback, useContext, useState } from 'react';

import { cn } from '@/features/spy-fall/lib/cn';

interface ToastItem {
	id: number;
	message: string;
	variant?: 'default' | 'success' | 'error';
}

interface ToastContextValue {
	toast: (message: string, variant?: ToastItem['variant']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [items, setItems] = useState<ToastItem[]>([]);

	const toast = useCallback((message: string, variant: ToastItem['variant'] = 'default') => {
		const id = Date.now();
		setItems((prev) => [...prev, { id, message, variant }]);
		setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200);
	}, []);

	return (
		<ToastContext.Provider value={{ toast }}>
			{children}
			<div className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+6rem)] left-0 right-0 z-[60] flex flex-col items-center gap-2 px-4">
				{items.map((t) => (
					<div
						key={t.id}
						className={cn(
							'pointer-events-auto animate-fade-in rounded-xl border px-4 py-3 text-sm font-medium shadow-lg',
							t.variant === 'success' && 'border-success/30 bg-success-subtle text-success',
							t.variant === 'error' && 'border-danger/30 bg-danger-subtle text-danger',
							(!t.variant || t.variant === 'default') &&
								'border-border bg-surface-elevated text-foreground',
						)}
						role="status"
					>
						{t.message}
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	const ctx = useContext(ToastContext);
	if (!ctx) return { toast: () => {} };
	return ctx;
}
