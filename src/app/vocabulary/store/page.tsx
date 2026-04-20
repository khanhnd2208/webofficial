import { auth } from '@/lib/auth';
import StoreClient from './StoreClient';

export const dynamic = 'force-dynamic';

export default async function StorePage() {
	const session = await auth();
	const isAdmin = session?.user?.role === 'admin';
	return <StoreClient isAdmin={isAdmin} />;
}
