/** Unique slot indexes that avoid already occupied positions in a group. */
export function memberSlotIndexes(usedSlots: number[], addCount: number): number[] {
	if (!Number.isInteger(addCount) || addCount < 0) return [];
	const occupied = new Set(usedSlots.filter((slot) => Number.isInteger(slot) && slot >= 0));
	const slots: number[] = [];
	for (let next = 0; slots.length < addCount; next += 1) {
		if (!occupied.has(next)) slots.push(next);
	}
	return slots;
}
