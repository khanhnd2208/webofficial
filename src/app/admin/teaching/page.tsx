import { routes } from '@/config/routes';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function TeachingClassesPage() {
	redirect(routes.mySpaceTeaching);
}
