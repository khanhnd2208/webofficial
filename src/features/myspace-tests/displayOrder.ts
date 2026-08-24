/** Stable catalogue ordering: admin displayOrder, then numeric-aware title. */
export function compareTestsByDisplayOrder(
	a: { displayOrder: number; title: string },
	b: { displayOrder: number; title: string },
): number {
	if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
	return a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true });
}
