import type { ReactNode } from 'react';
import Link from 'next/link';

import { McIcon } from '@/components/myclass/ui';

export function TeachingAppHeader({
	backHref,
	backLabel,
	eyebrow,
	title,
	description,
	actions,
	tabs,
}: {
	backHref: string;
	backLabel: string;
	eyebrow?: ReactNode;
	title: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
	tabs?: ReactNode;
}) {
	return (
		<header className="teaching-app-header" data-teaching-app-header>
			<div className="teaching-app-header-main">
				<Link href={backHref} className="teaching-app-header-back" aria-label={`Quay lại ${backLabel}`}>
					<McIcon name="arrow_back" size={18} />
					<span className="teaching-app-header-back-label">{backLabel}</span>
				</Link>
				<div className="teaching-app-header-identity">
					{eyebrow ? <p className="teaching-app-header-eyebrow">{eyebrow}</p> : null}
					<h1 className="teaching-app-header-title" title={typeof title === 'string' ? title : undefined}>{title}</h1>
					{description ? <div className="teaching-app-header-description">{description}</div> : null}
				</div>
				{actions ? <div className="teaching-app-header-actions">{actions}</div> : null}
			</div>
			{tabs ? <div className="teaching-app-header-tabs">{tabs}</div> : null}
		</header>
	);
}
