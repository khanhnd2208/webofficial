import { cn } from '@/lib/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
	error?: boolean;
}

export default function Select({ className, error, children, ...props }: SelectProps) {
	return (
		<select
			className={cn(
				'w-full min-h-11 rounded-xl border border-border bg-background px-4 py-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-50',
				error && 'border-danger',
				className,
			)}
			{...props}
		>
			{children}
		</select>
	);
}
