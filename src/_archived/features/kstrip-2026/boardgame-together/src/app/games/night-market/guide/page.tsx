import type { Metadata } from 'next';

import NightMarketGuideClient from '@/components/night-market/NightMarketGuideClient';

export const metadata: Metadata = { title: 'Luật chơi | Cổng Chợ Đêm' };
export default function NightMarketGuidePage() { return <main><NightMarketGuideClient /></main>; }
