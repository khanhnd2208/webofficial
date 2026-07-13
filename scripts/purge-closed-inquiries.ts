/**
 * Purge CLOSED inquiries older than 12 months.
 * Usage: npx tsx scripts/purge-closed-inquiries.ts [--apply]
 * Default is dry-run.
 */

import 'dotenv/config';
import mongoose from 'mongoose';

async function main() {
	const apply = process.argv.includes('--apply');
	const uri = process.env.MONGODB_URI;
	if (!uri) {
		console.error('Missing MONGODB_URI');
		process.exit(1);
	}
	await mongoose.connect(uri);
	const db = mongoose.connection.db;
	if (!db) throw new Error('No DB');

	const cutoff = new Date();
	cutoff.setFullYear(cutoff.getFullYear() - 1);

	const filter = {
		status: 'CLOSED',
		updatedAt: { $lt: cutoff },
	};

	const count = await db.collection('inquiries').countDocuments(filter);
	console.log(JSON.stringify({ dryRun: !apply, cutoff: cutoff.toISOString(), matched: count }, null, 2));

	if (apply && count > 0) {
		const result = await db.collection('inquiries').deleteMany(filter);
		console.log(JSON.stringify({ deleted: result.deletedCount }, null, 2));
	}

	await mongoose.disconnect();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
