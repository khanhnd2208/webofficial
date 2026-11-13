export function allocateSlots(entries, slotCount) {
	const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
	let free = slotCount - entries.length;
	for (const entry of entries) {
		const share = (entry.weight / total) * free;
		entry.n = 1 + Math.floor(share);
		entry.rest = share - Math.floor(share);
	}
	free = slotCount - entries.reduce((sum, entry) => sum + entry.n, 0);
	[...entries]
		.sort((a, b) => b.rest - a.rest)
		.slice(0, free)
		.forEach((entry) => {
			entry.n += 1;
		});
	// Rải đều: món nhiều ô nhất đặt trước, cách quãng, để hai ô giống nhau hiếm khi đứng cạnh nhau.
	const order = [...Array(slotCount).keys()].sort((a, b) => (a % 2) - (b % 2) || a - b);
	const slots = [];
	let cursor = 0;
	entries
		.sort((a, b) => b.n - a.n)
		.forEach((entry) => {
			for (let i = 0; i < entry.n; i += 1) {
				slots[order[cursor]] = entry.item;
				cursor += 1;
			}
		});
	return slots;
}
