import { cn } from '@/features/spy-fall/lib/cn';

type StampVariant = 'classified' | 'declassified' | 'suspect' | 'ready' | 'mission';

const variants: Record<StampVariant, string> = {
	classified: 'border-classified text-classified',
	declassified: 'border-success text-success',
	suspect: 'border-warning text-warning',
	ready: 'border-success text-success',
	mission: 'border-stamp text-stamp',
};

interface StampProps {
	label: string;
	variant?: StampVariant;
	className?: string;
	animate?: boolean;
}

export default function Stamp({ label, variant = 'classified', className, animate }: StampProps) {
	return (
		<span
			className={cn(
				'inline-block rotate-[-6deg] rounded border-2 px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.2em]',
				variants[variant],
				animate && 'animate-stamp-in',
				className,
			)}
		>
			{label}
		</span>
	);
}
