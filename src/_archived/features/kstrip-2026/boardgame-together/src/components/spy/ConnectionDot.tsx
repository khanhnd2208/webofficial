'use client';

import { cn } from '@/lib/cn';

interface Props {
	connected: boolean;
	className?: string;
}

export default function ConnectionDot({ connected, className = '' }: Props) {
	return (
		<span
			className={cn(
				'inline-block h-2.5 w-2.5 rounded-full',
				connected ? 'bg-success' : 'bg-muted',
				className,
			)}
			title={connected ? 'Đang kết nối' : 'Mất kết nối'}
			aria-label={connected ? 'Đang kết nối' : 'Mất kết nối'}
		/>
	);
}
