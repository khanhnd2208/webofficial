/** Fold accents so "khoa" matches "khóa". Shared by the catalog and the admin list. */
export function normalizeSearch(value: string) {
	return value
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/đ/g, 'd')
		.replace(/Đ/g, 'D')
		.toLowerCase();
}
