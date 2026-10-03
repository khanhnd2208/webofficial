import { routes } from '@/config/routes';

export function formatDuration(seconds: number) {
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	if (hours) return `${hours} giờ ${minutes % 60} phút`;
	if (minutes) return `${minutes} phút`;
	return `${seconds} giây`;
}

export function formatDate(value: string | null) {
	if (!value) return '—';
	return new Date(value).toLocaleString('vi-VN', {
		timeZone: 'Asia/Ho_Chi_Minh',
		dateStyle: 'short',
		timeStyle: 'short',
	});
}

export function formatDay(value: string) {
	return new Date(`${value}T12:00:00+07:00`).toLocaleDateString('vi-VN', {
		timeZone: 'Asia/Ho_Chi_Minh',
	});
}

export function reportHref(
	course: string,
	days: number,
	page: number,
	user?: string,
	sessionPage = 1,
) {
	const params = new URLSearchParams({ course, days: String(days), page: String(page) });
	if (user) {
		params.set('user', user);
		params.set('sessionPage', String(sessionPage));
	}
	return `${routes.admin.learnAnalytics}?${params}${user ? '#learner-study-title' : ''}`;
}
