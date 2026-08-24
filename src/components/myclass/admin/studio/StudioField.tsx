import type {
	InputHTMLAttributes,
	ReactNode,
	SelectHTMLAttributes,
	TextareaHTMLAttributes,
} from 'react';

const controlClass =
	'mt-1.5 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20';

export function StudioField({
	label,
	hint,
	error,
	children,
	className = '',
}: {
	label: string;
	hint?: string;
	error?: string | null;
	children: ReactNode;
	className?: string;
}) {
	return (
		<label className={`block text-sm ${className}`}>
			<span className="font-semibold text-ink">{label}</span>
			{children}
			{hint && !error ? <span className="mc-meta mt-1 block">{hint}</span> : null}
			{error ? <span className="mt-1 block text-xs text-error">{error}</span> : null}
		</label>
	);
}

export function StudioInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
	return <input className={`${controlClass} ${className}`} {...props} />;
}

export function StudioTextarea({
	className = '',
	...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
	return <textarea className={`${controlClass} py-2 ${className}`} {...props} />;
}

export function StudioSelect({
	className = '',
	children,
	...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
	return (
		<select className={`${controlClass} ${className}`} {...props}>
			{children}
		</select>
	);
}
