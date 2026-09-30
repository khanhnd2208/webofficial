/**
 * One-time migration: normalize all users with role='teacher' to role='student'.
 *
 * Background: the 'teacher' role has been removed from the active role set.
 * Going forward, the only roles are 'student' and 'admin'.
 *
 * Run once with:
 *   npx tsx scripts/normalizeTeacherRole.ts
 *
 * Safe to run multiple times (idempotent).
 */

import mongoose from 'mongoose';

async function main() {
	const uri = process.env.MONGODB_URI;
	if (!uri) {
		throw new Error('MONGODB_URI environment variable is not set');
	}

	await mongoose.connect(uri);
	console.log('Connected to MongoDB');

	const result = await mongoose.connection
		.collection('users')
		.updateMany({ role: 'teacher' }, { $set: { role: 'student' } });

	console.log(
		`Migration complete: ${result.matchedCount} matched, ${result.modifiedCount} updated`,
	);

	await mongoose.disconnect();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
