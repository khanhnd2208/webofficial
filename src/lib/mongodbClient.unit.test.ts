import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	connect: vi.fn(),
	construct: vi.fn(),
}));

vi.mock('mongodb', () => ({
	MongoClient: class {
		constructor(...args: unknown[]) {
			mocks.construct(...args);
		}
		connect = mocks.connect;
	},
}));

async function loadModule() {
	vi.resetModules();
	return import('@/lib/mongodbClient');
}

describe('getMongoClient', () => {
	beforeEach(() => {
		vi.stubEnv('MONGODB_URI', 'mongodb://127.0.0.1:27017/test');
		mocks.connect.mockReset();
		mocks.construct.mockReset();
	});

	it('retries after a failed connect instead of caching the failure', async () => {
		const { getMongoClient } = await loadModule();
		mocks.connect.mockRejectedValueOnce(new Error('ECONNREFUSED')).mockImplementation(function (
			this: unknown,
		) {
			return Promise.resolve(this);
		});

		await expect(getMongoClient()).rejects.toThrow('ECONNREFUSED');
		const client = await getMongoClient();

		expect(mocks.connect).toHaveBeenCalledTimes(2);
		expect(mocks.construct).toHaveBeenCalledTimes(1);
		expect(client).toBeDefined();
	});

	it('shares one connect between concurrent and later callers once it succeeds', async () => {
		const { getMongoClient } = await loadModule();
		mocks.connect.mockImplementation(function (this: unknown) {
			return Promise.resolve(this);
		});

		const [first, second] = await Promise.all([getMongoClient(), getMongoClient()]);
		const third = await getMongoClient();

		expect(first).toBe(second);
		expect(third).toBe(first);
		expect(mocks.connect).toHaveBeenCalledTimes(1);
	});

	it('fails server selection fast enough for the 5 s health check', async () => {
		const { getMongoClient } = await loadModule();
		mocks.connect.mockResolvedValue(undefined);

		await getMongoClient();

		expect(mocks.construct).toHaveBeenCalledWith('mongodb://127.0.0.1:27017/test', {
			serverSelectionTimeoutMS: 5000,
		});
	});

	it('refuses to load without MONGODB_URI', async () => {
		vi.stubEnv('MONGODB_URI', '');
		await expect(loadModule()).rejects.toThrow('Missing MONGODB_URI');
	});
});
