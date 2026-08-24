export function slugify(input: string): string {
	return input
		.replace(/đ/g, 'd')
		.replace(/Đ/g, 'D')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-');
}
