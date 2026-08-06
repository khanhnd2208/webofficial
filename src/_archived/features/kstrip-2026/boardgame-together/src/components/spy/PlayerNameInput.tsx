'use client';

import { useRef } from 'react';

import { Input } from '@/components/ui';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
	className?: string;
	error?: boolean;
}

/** Name input tuned for mobile keyboards (iOS zoom-safe, enter key hint). */
export default function PlayerNameInput({ className, error, onFocus, ...props }: Props) {
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<Input
			ref={inputRef}
			inputMode="text"
			enterKeyHint="go"
			autoCapitalize="words"
			autoComplete="nickname"
			autoCorrect="off"
			spellCheck={false}
			className={className ?? 'scroll-mt-24 text-lg'}
			error={error}
			onFocus={(e) => {
				onFocus?.(e);
				requestAnimationFrame(() => {
					inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
				});
			}}
			{...props}
		/>
	);
}
