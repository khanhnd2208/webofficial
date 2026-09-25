import { cn } from '@/features/spy-fall/lib/cn';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
	label: string;
}

export default function Checkbox({ label, className, id, ...props }: CheckboxProps) {
	const inputId = id ?? label.replace(/\s+/g, '-').toLowerCase();
	return (
		<label htmlFor={inputId} className={cn('flex items-center gap-3 cursor-pointer', className)}>
			<input
				id={inputId}
				type="checkbox"
				className="h-5 w-5 rounded border-border text-accent focus:ring-accent/40"
				{...props}
			/>
			<span className="text-sm text-foreground-secondary">{label}</span>
		</label>
	);
}
