import type { Metadata } from 'next';

import WerewolfMenuClient from '@/features/werewolf/components/WerewolfMenuClient';

export const metadata: Metadata = {
	title: 'Ma Sói | Board Game',
	description: 'Chia thẻ vai Ma Sói cho cả nhóm, 5–20 người. Quản trò tạo phòng, mọi người xem thẻ trên điện thoại của mình.',
};

export default function MaSoiPage() {
	return (
		<main className="min-h-screen">
			<WerewolfMenuClient />
		</main>
	);
}
