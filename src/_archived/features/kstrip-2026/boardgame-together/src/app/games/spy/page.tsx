import type { Metadata } from 'next';

import SpyMenuClient from './SpyMenuClient';

export const metadata: Metadata = {
	title: "AI Là Gián Điệp | K'sTrip",
	description: 'Trò chơi suy luận xã hội — chơi trực tiếp cùng nhau, điện thoại hỗ trợ vai và vote.',
};

export default function SpyPage() {
	return (
		<main className="min-h-screen">
			<SpyMenuClient />
		</main>
	);
}
