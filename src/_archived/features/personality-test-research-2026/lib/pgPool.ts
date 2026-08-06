/* ════════════════════════════════════════════════════════════════════════
   PostgreSQL Connection Pool
   
   Singleton pool for the personality test feature.
   Uses the `pg` library with environment-based configuration.
   
   Environment variables:
   - DATABASE_URL  — full connection string (preferred)
   - PG_HOST, PG_PORT, PG_USER, PG_PASSWORD, PG_DATABASE — individual
   ════════════════════════════════════════════════════════════════════════ */

import { Pool, type PoolConfig } from 'pg';

// Singleton pattern: reuse across hot reloads in development
const globalForPg = globalThis as unknown as { _pgPool?: Pool };

function createPool(): Pool {
	const connectionString = process.env.DATABASE_URL;

	const config: PoolConfig = connectionString
		? {
				connectionString,
				max: 10,
				idleTimeoutMillis: 30_000,
				connectionTimeoutMillis: 5_000,
			}
		: {
				host: process.env.PG_HOST ?? 'localhost',
				port: Number(process.env.PG_PORT ?? 5432),
				user: process.env.PG_USER ?? 'postgres',
				password: process.env.PG_PASSWORD ?? '',
				database: process.env.PG_DATABASE ?? 'khanhwebsite',
				max: 10,
				idleTimeoutMillis: 30_000,
				connectionTimeoutMillis: 5_000,
			};

	const pool = new Pool(config);

	pool.on('error', (err) => {
		console.error('[PG Pool] Unexpected error on idle client:', err);
	});

	return pool;
}

export const pgPool: Pool =
	globalForPg._pgPool ?? (globalForPg._pgPool = createPool());

// Preserve pool across hot reloads in dev
if (process.env.NODE_ENV !== 'production') {
	globalForPg._pgPool = pgPool;
}
