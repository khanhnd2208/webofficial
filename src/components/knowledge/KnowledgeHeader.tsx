import Link from 'next/link';
import { routes } from '@/config/routes';

export default function KnowledgeHeader({
	crumb,
	user,
	loginHref,
}: {
	crumb?: string;
	user?: { name?: string | null; email?: string | null } | null;
	loginHref?: string;
}) {
	const label = user?.name || user?.email || null;
	return (
		<header className="mc-learner-header">
			<div className="mc-learner-header-inner">
				<Link href={routes.myClass} className="mc-brand" aria-label="Kho kiến thức">
					<span className="mc-brand-mark" aria-hidden="true">
						K
					</span>
					<span>Kho kiến thức</span>
				</Link>
				{crumb ? <span className="mc-header-crumb">/ {crumb}</span> : null}
				<div className="mc-header-actions">
					{label ? (
						<span className="mc-avatar" title={label}>
							{label.slice(0, 1).toUpperCase()}
						</span>
					) : null}
					{!label && loginHref ? (
						<Link href={loginHref} className="mc-header-link">
							Đăng nhập
						</Link>
					) : null}
					<Link href={routes.mySpace} className="mc-header-link">
						My Space
					</Link>
				</div>
			</div>
		</header>
	);
}
