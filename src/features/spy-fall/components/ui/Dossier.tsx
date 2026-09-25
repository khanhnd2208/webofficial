'use client';

import { cn } from '@/features/spy-fall/lib/cn';

interface DossierProps {
	revealed: boolean;
	onRevealStart: () => void;
	onRevealEnd: () => void;
	children: React.ReactNode;
	className?: string;
}

export default function Dossier({
	revealed,
	onRevealStart,
	onRevealEnd,
	children,
	className,
}: DossierProps) {
	return (
		<div className={cn('mx-auto max-w-sm select-none touch-none', className)}>
			<div
				className={cn(
					'relative min-h-[220px] overflow-hidden rounded-2xl border-2 transition-[border-color,box-shadow] duration-[var(--dur-standard)]',
					revealed
						? 'border-stamp bg-accent-subtle shadow-lg'
						: 'border-border bg-surface-secondary shadow-sm',
				)}
				onPointerDown={onRevealStart}
				onPointerUp={onRevealEnd}
				onPointerLeave={onRevealEnd}
				onContextMenu={(e) => e.preventDefault()}
			>
				{!revealed && (
					<div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface-secondary/95 backdrop-blur-[2px]">
						<span className="font-mono text-xs uppercase tracking-[0.3em] text-classified">Classified</span>
						<p className="font-display text-xl font-bold text-muted">Giữ để mở hồ sơ</p>
						<p className="text-xs text-muted-foreground px-6 text-center">
							Chạm và giữ — đừng để người khác nhìn thấy
						</p>
					</div>
				)}
				<div
					className={cn(
						'flex min-h-[220px] flex-col items-center justify-center p-8 transition-opacity duration-[var(--dur-fast)]',
						revealed ? 'opacity-100' : 'opacity-0',
					)}
				>
					{children}
				</div>
			</div>
		</div>
	);
}
