import { beforeAll, afterAll, afterEach } from 'vitest';
import { config } from 'dotenv';

import {
	clearTestMongoCollections,
	disconnectTestMongo,
	setupIntegrationMongo,
} from '@/test/helpers/db.mongo';

config({ path: '.env.test' });
config({ path: '.env.local' });

if (!process.env.TEST_DATABASE_URL?.trim()) {
	throw new Error(
		'TEST_DATABASE_URL is required for integration tests. Refusing to use DATABASE_URL.',
	);
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

beforeAll(async () => {
	await setupIntegrationMongo();
}, 60_000);

afterEach(async () => {
	await clearTestMongoCollections();
});

afterAll(async () => {
	await disconnectTestMongo();
});
