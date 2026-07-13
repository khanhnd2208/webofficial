/**
 * Dry-run journal taxonomy migration.
 * Usage: npx tsx scripts/journal-taxonomy-dry-run.ts
 * Does NOT write to the database.
 */

import 'dotenv/config';
import mongoose from 'mongoose';

import { LEGACY_CATEGORY_TO_PILLAR } from '../src/content/journal';

async function main() {
	const uri = process.env.MONGODB_URI;
	if (!uri) {
		console.error('Missing MONGODB_URI');
		process.exit(1);
	}
	await mongoose.connect(uri);
	const db = mongoose.connection.db;
	if (!db) throw new Error('No DB');

	const posts = await db
		.collection('posts')
		.find({ isPublished: true })
		.project({ title: 1, slug: 1, category: 1, pillarSlug: 1, contentType: 1, tags: 1 })
		.toArray();

	const rows = posts.map((p) => {
		const category = String(p.category ?? 'Uncategorized');
		const suggestedPillar = LEGACY_CATEGORY_TO_PILLAR[category] ?? 'personal-notes';
		const hasPillar = Boolean(p.pillarSlug);
		const hasType = Boolean(p.contentType);
		return {
			slug: p.slug,
			title: p.title,
			category,
			pillarSlug: p.pillarSlug ?? null,
			contentType: p.contentType ?? null,
			suggestedPillar,
			needsPillar: !hasPillar,
			needsContentType: !hasType,
		};
	});

	const missingPillar = rows.filter((r) => r.needsPillar);
	const missingType = rows.filter((r) => r.needsContentType);

	console.log(JSON.stringify({
		totalPublished: rows.length,
		missingPillar: missingPillar.length,
		missingContentType: missingType.length,
		taxonomyComplete: missingPillar.length === 0 && missingType.length === 0 && rows.length > 0,
		suggestedMappings: missingPillar.map((r) => ({
			slug: r.slug,
			category: r.category,
			suggestedPillar: r.suggestedPillar,
		})),
	}, null, 2));

	await mongoose.disconnect();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
