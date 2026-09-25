import type { Metadata } from 'next';

import SpyGuide from '@/features/spy-fall/components/spy/SpyGuide';

export const metadata: Metadata = {
	title: 'Hướng dẫn Spy Fall | Board Game',
};

export default function SpyFallGuidePage() {
	return <SpyGuide />;
}
