/* ════════════════════════════════════════════════════════════════════════
   Prisma Client Singleton (Prisma 7 + pg driver adapter)

   Prisma 7 requires a driver adapter instead of reading DATABASE_URL
   directly. We use @prisma/adapter-pg backed by the existing pg Pool.

   Caches the client in globalThis to prevent connection pool exhaustion
   during Next.js Hot-Module-Replacement and serverless cold starts.

   The cache is keyed by generated model names so a client created before
   `prisma generate` is not reused after My Class models are added.

   Usage:
     import { prisma } from '@/lib/prisma';
   ════════════════════════════════════════════════════════════════════════ */
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';

const PRISMA_GENERATION = [
	Prisma.ModelName.ActiveRecallDeck,
	Prisma.ModelName.ActiveRecallCard,
	Prisma.ModelName.MyClassVocabAssignment,
	Prisma.ModelName.MyClassKuProgress,
	Prisma.ModelName.MyClassCourse,
	Prisma.ModelName.TeachingClass,
	Prisma.ModelName.TeachingClassNote,
	Prisma.ModelName.TeachingGroupBoard,
	Prisma.ModelName.TeachingGroup,
	Prisma.ModelName.TeachingGroupAssignment,
	Prisma.ModelName.TeachingGroupAudit,
	'TeachingEnrollment.learningExperience.v2',
	'TeachingGroupBoard.tutorialClassId.v1',
	'TeachingGroup.maxSize.v1',
].join('|');

type PrismaGlobal = {
	__khanhwebsitePrisma?: PrismaClient;
	__khanhwebsitePrismaGeneration?: string;
};

const globalForPrisma = globalThis as PrismaGlobal;

function createPrismaClient(): PrismaClient {
	const connectionString = process.env.DATABASE_URL;
	const pool = new Pool(
		connectionString
			? { connectionString, max: 10, idleTimeoutMillis: 30_000 }
			: {
					host: process.env.PG_HOST ?? 'localhost',
					port: Number(process.env.PG_PORT ?? 5432),
					user: process.env.PG_USER ?? 'postgres',
					password: process.env.PG_PASSWORD ?? '',
					database: process.env.PG_DATABASE ?? 'teaching_platform_vocab',
					max: 10,
					idleTimeoutMillis: 30_000,
				},
	);
	const adapter = new PrismaPg(pool);
	const client = new PrismaClient({
		adapter,
		log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
	});
	assertGeneratedClient(client);
	return client;
}

function assertGeneratedClient(client: PrismaClient): void {
	if (
		typeof client.activeRecallDeck?.findMany === 'function' &&
		typeof client.activeRecallCard?.findMany === 'function' &&
		typeof client.myClassVocabAssignment?.findMany === 'function' &&
		typeof client.teachingGroupBoard?.findMany === 'function' &&
		typeof client.teachingClassNote?.findMany === 'function'
	) {
		return;
	}
	throw new Error(
		'Prisma Client is missing generated models. Run `npx prisma generate` and restart `next dev`.',
	);
}

function discardClient(client: PrismaClient | undefined): void {
	if (client && typeof client.$disconnect === 'function') {
		void client.$disconnect().catch(() => undefined);
	}
}

function getPrismaClient(): PrismaClient {
	const cached = globalForPrisma.__khanhwebsitePrisma;
	if (
		cached &&
		globalForPrisma.__khanhwebsitePrismaGeneration === PRISMA_GENERATION &&
		typeof cached.activeRecallDeck?.findMany === 'function' &&
		typeof cached.activeRecallCard?.findMany === 'function' &&
		typeof cached.myClassVocabAssignment?.findMany === 'function' &&
		typeof cached.teachingGroupBoard?.findMany === 'function' &&
		typeof cached.teachingClassNote?.findMany === 'function'
	) {
		return cached;
	}
	discardClient(cached);
	const client = createPrismaClient();
	if (process.env.NODE_ENV !== 'production') {
		globalForPrisma.__khanhwebsitePrisma = client;
		globalForPrisma.__khanhwebsitePrismaGeneration = PRISMA_GENERATION;
	}
	return client;
}

export const prisma: PrismaClient = getPrismaClient();
