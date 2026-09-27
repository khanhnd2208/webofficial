import type { Metadata } from 'next';

import CheeseThiefMenuClient from '@/features/cheese-thief/components/CheeseThiefMenuClient';

export const metadata: Metadata = {
	title: 'Cheese Thief | Board Game',
	description: 'Party game cho 4–12 người. Điện thoại chỉ chia bí mật, canh đêm, và tính phiếu.',
};

export default function CheeseThiefPage() {
	return (
		<main className="min-h-screen">
			<CheeseThiefMenuClient />
		</main>
	);
}
