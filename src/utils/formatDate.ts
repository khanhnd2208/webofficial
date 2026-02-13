export function formatDate(date: Date | string | number): string {
	const d = new Date(date);
	if (Number.isNaN(d.getTime())) return '';
	const dd = String(d.getDate()).padStart(2, '0');
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const yyyy = d.getFullYear();
	return `${dd}/${mm}/${yyyy}`;
}
