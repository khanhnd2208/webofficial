import type { ReactNode } from 'react';

type FormFieldProps = {
	id: string;
	label: string;
	hint?: string;
	error?: string;
	required?: boolean;
	children: ReactNode;
};

export function FormField({ id, label, hint, error, required, children }: FormFieldProps) {
	const hintId = hint ? `${id}-hint` : undefined;
	const errorId = error ? `${id}-error` : undefined;
	const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

	return (
		<div className="space-y-1.5">
			<label htmlFor={id} className="block text-sm font-semibold text-foreground">
				{label}
				{required ? <span className="text-error"> *</span> : null}
			</label>
			<div
				className="[&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-md [&_input]:border [&_input]:border-border-strong [&_input]:bg-surface [&_input]:px-3 [&_input]:text-sm [&_input]:text-foreground [&_input]:focus-visible:outline-none [&_input]:focus-visible:ring-2 [&_input]:focus-visible:ring-accent [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-md [&_select]:border [&_select]:border-border-strong [&_select]:bg-surface [&_select]:px-3 [&_select]:text-sm [&_textarea]:w-full [&_textarea]:rounded-md [&_textarea]:border [&_textarea]:border-border-strong [&_textarea]:bg-surface [&_textarea]:px-3 [&_textarea]:py-2.5 [&_textarea]:text-sm"
				data-describedby={describedBy}
			>
				{children}
			</div>
			{hint && !error ? (
				<p id={hintId} className="text-xs text-muted">
					{hint}
				</p>
			) : null}
			{error ? (
				<p id={errorId} className="text-xs text-error" role="alert">
					{error}
				</p>
			) : null}
		</div>
	);
}
