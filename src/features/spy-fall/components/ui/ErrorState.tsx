'use client';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';

import Button from './Button';
import { cn } from '@/features/spy-fall/lib/cn';

interface ErrorStateProps {
	title?: string;
	message: string;
	onRetry?: () => void;
	retryLabel?: string;
	className?: string;
}

export default function ErrorState({
	title,
	message,
	onRetry,
	retryLabel,
	className,
}: ErrorStateProps) {
	const t = useT();
	return (
		<div className={cn('rounded-xl border border-danger/30 bg-danger-subtle px-4 py-4 text-center', className)} role="alert">
			<p className="font-semibold text-danger">{title ?? t('common.errorTitle')}</p>
			<p className="mt-1 text-sm text-foreground-secondary">{message}</p>
			{onRetry ? (
				<Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
					{retryLabel ?? t('common.retry')}
				</Button>
			) : null}
		</div>
	);
}
