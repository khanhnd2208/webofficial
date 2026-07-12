import mongoose from 'mongoose';

type MongooseCache = {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
};

function getMongoUri(): string {
	const uri = process.env.MONGODB_URI;
	if (!uri) {
		throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
	}
	return uri;
}

declare global {
	var mongoose: MongooseCache | undefined;
}

const cached = global.mongoose ?? (global.mongoose = { conn: null, promise: null });

export default async function dbConnect(): Promise<typeof mongoose> {
	if (cached.conn) return cached.conn;

	if (!cached.promise) {
		const uri = getMongoUri();
		cached.promise = mongoose
			.connect(uri, {
				bufferCommands: false,
				// Limit connection pool to avoid overwhelming free-tier clusters.
				maxPoolSize: 10,
				// Fail fast if the server is unreachable.
				serverSelectionTimeoutMS: 5000,
				// Close idle sockets after 30 s to avoid stale connections.
				socketTimeoutMS: 30000,
			})
			.then((m) => m);
	}

	try {
		cached.conn = await cached.promise;
	} catch (error) {
		cached.promise = null;
		throw error;
	}
	return cached.conn;
}
