import type { Metadata } from 'next';

import CheeseThiefMenuClient from '@/features/cheese-thief/components/CheeseThiefMenuClient';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
	title: 'Cheese Thief | Board Game',
	description: 'Party game cho 4–12 người. Điện thoại chỉ chia bí mật, canh đêm, và tính phiếu.',
};

export default async function CheeseThiefPage() {
	const session = await auth();
	return (
		<main className="min-h-screen">
			<CheeseThiefMenuClient isAdmin={session?.user?.role === 'admin'} />
		</main>
	);
}
