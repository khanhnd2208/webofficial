import type { Metadata } from 'next';

import PublicReportDashboard from './PublicReportDashboard';

export const metadata: Metadata = {
	title: 'Báo cáo tổng hợp — Personality Test',
	description: 'Trang tổng hợp kết quả bài trắc nghiệm tính cách (password-protected).',
	robots: { index: false, follow: false },
};

export default function PublicReportPage() {
	return <PublicReportDashboard />;
}
