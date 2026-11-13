import type { Metadata } from 'next';

import { Fmt2026Booth } from '@/features/fmt2026/components/Fmt2026Booth';

export const metadata: Metadata = {
	title: 'FMT 2026 · Nhận quà trở về',
	description: 'Quầy bốc quà của FMT 2026.',
	// An event screen, not a page to find in search.
	robots: { index: false, follow: false },
};

export default function Fmt2026Page() {
	return <Fmt2026Booth />;
}
