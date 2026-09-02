import { prisma } from '@/lib/prisma';

async function main() {
	const rows = await prisma.$queryRaw<Array<{ studentCode: string; normalized: string; count: bigint }>>`
		SELECT "studentCode", upper(btrim("studentCode")) AS normalized, COUNT(*)::bigint AS count
		FROM "TeachingStudent"
		GROUP BY 1, 2
	`;
	const collisions = new Map<string, string[]>();
	for (const row of rows) {
		const list = collisions.get(row.normalized) ?? [];
		list.push(row.studentCode);
		collisions.set(row.normalized, list);
	}
	const conflicts = [...collisions.entries()].filter(([, codes]) => new Set(codes).size > 1);
	if (conflicts.length === 0) {
		console.log('No teaching student-code collisions.');
		return;
	}
	console.error('Reconcile these student codes before applying the normalized unique key:');
	for (const [normalized, codes] of conflicts) {
		console.error(`${normalized}: ${[...new Set(codes)].join(', ')}`);
	}
	process.exitCode = 1;
}

main().finally(async () => {
	await prisma.$disconnect();
});
