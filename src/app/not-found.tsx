import type { Metadata } from 'next';

import NotFoundPanel from '@/components/site/NotFoundPanel';

export const metadata: Metadata = {
	title: 'Không tìm thấy trang',
};

export default function NotFound() {
	return <NotFoundPanel />;
}
