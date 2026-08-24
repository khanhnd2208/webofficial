export const BLOOM_MIN = 1;
export const BLOOM_MAX = 6;

export const BLOOM_LABELS: Record<number, string> = {
	1: 'Nhớ',
	2: 'Hiểu',
	3: 'Áp dụng',
	4: 'Phân tích',
	5: 'Đánh giá',
	6: 'Sáng tạo',
};

export function bloomLabel(value: number): string {
	return BLOOM_LABELS[value] ?? String(value);
}

export function isBloomLevel(value: number): boolean {
	return Number.isInteger(value) && value >= BLOOM_MIN && value <= BLOOM_MAX;
}
