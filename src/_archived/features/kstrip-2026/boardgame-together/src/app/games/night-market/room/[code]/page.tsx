import type { Metadata } from 'next';

import NightMarketGameClient from '@/components/night-market/NightMarketGameClient';

export const metadata: Metadata = { title: 'Phòng chơi | Cổng Chợ Đêm' };
export default async function NightMarketRoomPage({ params }: { params: Promise<{ code: string }> }) {
	const { code } = await params;
	return <main><NightMarketGameClient code={code.toUpperCase()} /></main>;
}
