const naturalVietnameseCollator = new Intl.Collator('vi', {
	numeric: true,
	sensitivity: 'base',
});

/**
 * Compare labels the way people read numbered names: 1 and 01 are equivalent,
 * while 2 sorts before 10.
 */
export function compareNaturalText(left: string, right: string): number {
	return naturalVietnameseCollator.compare(left.trim(), right.trim());
}
