import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI ?? '';
if (!uri) {
	throw new Error('Missing MONGODB_URI');
}

type MongoClientCache = {
	client?: MongoClient;
	connecting?: Promise<MongoClient>;
};

type GlobalWithMongo = typeof globalThis & {
	_mongoClientCache?: MongoClientCache;
};

// Dev hot reload re-evaluates this module; keep one client across reloads there.
const cache: MongoClientCache =
	process.env.NODE_ENV === 'development'
		? ((globalThis as GlobalWithMongo)._mongoClientCache ??= {})
		: {};

/**
 * Connected native client for the Auth.js adapter and direct collection reads.
 *
 * A failed connect is forgotten, so the next call retries. Caching the rejected
 * promise left production failing every Mongo request after MongoDB came back,
 * until the process restarted. Once connected, the driver reconnects by itself.
 */
export function getMongoClient(): Promise<MongoClient> {
	if (!cache.connecting) {
		// Same fast server selection as Mongoose in dbConnect.ts: health checks
		// time out after 5 s, and the driver default is 30 s.
		cache.client ??= new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
		cache.connecting = cache.client.connect().catch((error: unknown) => {
			cache.connecting = undefined;
			throw error;
		});
	}
	return cache.connecting;
}
