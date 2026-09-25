import type { Metadata } from 'next';

import SpyMenuClient from '@/features/spy-fall/components/spy/SpyMenuClient';

export const metadata: Metadata = {
	title: 'Spy Fall | Board Game',
	description: 'Party game suy luận xã hội cho 4–12 người chơi.',
};

export default function SpyFallPage() {
	return (
		<main className="min-h-screen">
			<SpyMenuClient />
		</main>
	);
}
