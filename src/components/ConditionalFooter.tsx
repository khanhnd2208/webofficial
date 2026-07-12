'use client';

import { usePathname } from 'next/navigation';

import SiteFooter from './SiteFooter';
import { routes } from '@/config/routes';

/** Footer only on public / learner surfaces — not admin, login, or public message recipient. */
export default function ConditionalFooter() {
	const pathname = usePathname();
	if (pathname.startsWith('/admin')) return null;
	if (pathname.startsWith(routes.login)) return null;
	if (pathname.startsWith('/m/')) return null;
	return <SiteFooter />;
}
