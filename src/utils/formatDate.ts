export function formatDate(date: Date | string | number): string {
	const d = new Date(date);
	if (Number.isNaN(d.getTime())) return '';
	const dd = String(d.getDate()).padStart(2, '0');
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const yyyy = d.getFullYear();
	return `${dd}/${mm}/${yyyy}`;
}

export function formatDateTime(date: Date | string | number): string {
	const d = new Date(date);
	if (Number.isNaN(d.getTime())) return '';
	const dd = String(d.getDate()).padStart(2, '0');
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const yyyy = d.getFullYear();
	const hh = String(d.getHours()).padStart(2, '0');
	const min = String(d.getMinutes()).padStart(2, '0');
	return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export function formatDistanceToNow(date: Date | string | number): string {
	const d = new Date(date);
	if (Number.isNaN(d.getTime())) return '';
	const diff = Date.now() - d.getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 1) return 'vừa xong';
	if (mins < 60) return `${mins} phút trước`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs} giờ trước`;
	const days = Math.floor(hrs / 24);
	if (days < 7) return `${days} ngày trước`;
	if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
	if (days < 365) return `${Math.floor(days / 30)} tháng trước`;
	return `${Math.floor(days / 365)} năm trước`;
}
