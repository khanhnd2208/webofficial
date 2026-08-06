import type { Metadata } from 'next';

import NightMarketMenuClient from '@/components/night-market/NightMarketMenuClient';

export const metadata: Metadata = { title: "Cổng Chợ Đêm | K'sTrip", description: 'Party game bluffing và thương lượng cho 1–6 người cùng bot.' };
export default function NightMarketPage() { return <main><NightMarketMenuClient /></main>; }
