'use client';

import { useT } from '@/components/i18n/LocaleProvider';

interface DistributionProgressProps {
	viewed: number;
	total: number;
	className?: string;
}

export default function DistributionProgress({ viewed, total, className }: DistributionProgressProps) {
	const t = useT();

	return (
		<p className={`text-sm text-muted-foreground ${className ?? ''}`}>
			{t('mafia.distribution.progress', { viewed, total })}
		</p>
	);
}
