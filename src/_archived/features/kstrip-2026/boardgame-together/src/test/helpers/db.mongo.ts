import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;

export async function connectTestMongo(): Promise<string> {
	if (mongoose.connection.readyState !== 0) {
		await mongoose.disconnect();
	}
	mongoServer = await MongoMemoryServer.create();
	const uri = mongoServer.getUri();
	await mongoose.connect(uri);
	return uri;
}

export async function disconnectTestMongo(): Promise<void> {
	if (mongoose.connection.readyState !== 0) {
		await mongoose.disconnect();
	}
	if (global.mongoose) {
		global.mongoose.conn = null;
		global.mongoose.promise = null;
	}
	if (mongoServer) {
		await mongoServer.stop();
		mongoServer = null;
	}
}

/** Call before integration tests to wire dbConnect to an in-memory MongoDB. */
export async function setupIntegrationMongo(): Promise<string> {
	if (mongoServer) {
		return mongoServer.getUri();
	}
	const uri = await connectTestMongo();
	process.env.MONGODB_URI = uri;
	if (global.mongoose) {
		global.mongoose.conn = null;
		global.mongoose.promise = null;
	}
	return uri;
}

export async function clearTestMongoCollections(): Promise<void> {
	const { collections } = mongoose.connection;
	for (const key of Object.keys(collections)) {
		await collections[key].deleteMany({});
	}
}
