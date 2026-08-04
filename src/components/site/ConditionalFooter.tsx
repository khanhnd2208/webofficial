'use client';

import { usePathname } from 'next/navigation';

import SiteFooter from './SiteFooter';
import { routes } from '@/config/routes';

/** Footer only on public marketing surfaces — not admin, login, or public message recipient. */
export default function ConditionalFooter() {
	const pathname = usePathname();
	const publicRoute =
		pathname === routes.home ||
		pathname === routes.about ||
		pathname === routes.projects ||
		pathname.startsWith(`${routes.projects}/`) ||
		pathname === routes.services ||
		pathname === routes.contact ||
		pathname === routes.notes ||
		pathname.startsWith(`${routes.notes}/`);
	if (!publicRoute) return null;
	return <SiteFooter />;
}
