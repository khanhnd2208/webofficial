import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { TEST_DATABASE_URL } from '@/test/env';

let pool: Pool | null = null;
let prisma: PrismaClient | null = null;

export function getTestPool(): Pool {
	if (!pool) {
		pool = new Pool({ connectionString: TEST_DATABASE_URL });
	}
	return pool;
}

export function getTestPrisma(): PrismaClient {
	if (!prisma) {
		const adapter = new PrismaPg(getTestPool());
		prisma = new PrismaClient({ adapter });
	}
	return prisma;
}

export async function disconnectTestPrisma(): Promise<void> {
	if (prisma) {
		await prisma.$disconnect();
		prisma = null;
	}
	if (pool) {
		await pool.end();
		pool = null;
	}
}

/** Remove test data for given user IDs and owner IDs. */
export async function cleanupVocabTestData(
	userIds: string[],
	ownerIds: string[],
): Promise<void> {
	const db = getTestPrisma();
	await db.userVocabSet.deleteMany({ where: { userId: { in: userIds } } });
	await db.gameScore.deleteMany({ where: { userId: { in: userIds } } });
	await db.word.deleteMany({ where: { vocabSet: { ownerId: { in: ownerIds } } } });
	await db.vocabSet.deleteMany({ where: { ownerId: { in: ownerIds } } });
}
