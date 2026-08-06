import { cn } from '@/lib/cn';

interface FieldProps {
	label: string;
	htmlFor?: string;
	error?: string | null;
	hint?: string;
	children: React.ReactNode;
	className?: string;
}

export default function Field({ label, htmlFor, error, hint, children, className }: FieldProps) {
	return (
		<div className={cn('block space-y-1.5', className)}>
			<label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
				{label}
			</label>
			{children}
			{hint && !error ? <p className="text-xs text-muted">{hint}</p> : null}
			{error ? (
				<p className="text-xs text-danger" role="alert">
					{error}
				</p>
			) : null}
		</div>
	);
}
