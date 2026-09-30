import { forwardRef } from 'react';

import { cn } from '@/features/board-game-shared/lib/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
	{ className, error, ...props },
	ref,
) {
	return (
		<input
			ref={ref}
			className={cn(
				'w-full min-h-11 rounded-xl border border-border bg-background px-4 py-3 text-foreground transition placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-50',
				error && 'border-danger ring-1 ring-danger/30',
				className,
			)}
			{...props}
		/>
	);
});

export default Input;
