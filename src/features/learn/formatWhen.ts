export function absoluteWhen(iso: string) {
	return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function relativeWhen(iso: string, now = Date.now()) {
	const minutes = Math.round((now - new Date(iso).getTime()) / 60_000);
	if (minutes < 1) return 'Vừa xong';
	if (minutes < 60) return `${minutes} phút trước`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours} giờ trước`;
	const days = Math.round(hours / 24);
	if (days < 30) return `${days} ngày trước`;
	return absoluteWhen(iso);
}
