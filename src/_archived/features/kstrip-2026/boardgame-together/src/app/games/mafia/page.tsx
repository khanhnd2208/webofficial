import type { Metadata } from 'next';

import MafiaGameClient from '@/components/mafia/MafiaGameClient';

export const metadata: Metadata = {
	title: "Ma Sói | K'sTrip",
	description: 'Chia vai Ma Sói trên một điện thoại — chuyền tay xem vai bí mật.',
};

export default function MafiaPage() {
	return (
		<main className="min-h-screen">
			<MafiaGameClient />
		</main>
	);
}
