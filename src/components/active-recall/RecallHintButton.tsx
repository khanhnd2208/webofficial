'use client';

import { Icon } from '@/components/ui/Icon';
import { useId, type ButtonHTMLAttributes, type PointerEvent, type ReactNode } from 'react';

function isMousePointer(event: Pick<PointerEvent<HTMLElement>, 'pointerType'>) {
	return event.pointerType === 'mouse';
}

export function RecallSizeGlyph({ size }: { size: 'small' | 'large' }) {
	return (
		<span className={`recall-size-glyph is-${size}`} aria-hidden="true">
			A
		</span>
	);
}

export function RecallPresentIcon() {
	return <Icon name="fullscreen" size={20} aria-hidden="true" />;
}

export default function RecallHintButton({
	hint,
	label,
	className,
	onClick,
	children,
	type = 'button',
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
	hint: string;
	label?: string;
	children: ReactNode;
}) {
	const hintId = useId();

	function hideHintAfterTouch(event: PointerEvent<HTMLButtonElement>) {
		if (isMousePointer(event)) return;
		event.currentTarget.closest('.recall-tip')?.setAttribute('data-touch-used', '');
		event.currentTarget.blur();
	}

	return (
		<div
			className="recall-tip"
			onPointerEnter={(event) => {
				if (isMousePointer(event)) event.currentTarget.removeAttribute('data-touch-used');
			}}
		>
			<button
				{...props}
				type={type}
				className={className}
				aria-label={label}
				aria-describedby={hintId}
				onPointerUp={hideHintAfterTouch}
				onClick={(event) => {
					onClick?.(event);
					event.currentTarget.blur();
				}}
			>
				{children}
			</button>
			<p id={hintId} role="tooltip" className="recall-tip-bubble">
				{hint}
			</p>
		</div>
	);
}
