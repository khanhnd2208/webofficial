import type { Metadata } from 'next';

import SpyMenuClient from '@/features/spy-fall/components/spy/SpyMenuClient';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
	title: 'Spy Fall | Board Game',
	description: 'Party game suy luận xã hội cho 4–12 người chơi.',
};

export default async function SpyFallPage() {
	const session = await auth();
	return (
		<main className="min-h-screen">
			<SpyMenuClient isAdmin={session?.user?.role === 'admin'} />
		</main>
	);
}
