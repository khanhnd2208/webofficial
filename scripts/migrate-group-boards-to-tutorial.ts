/** After prisma migrate deploy: default/--dry-run inspect only; --apply commits. */
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { migrateLegacyGroupBoards } from './lib/groupBoardMigration';

async function main() {
	expand(config({ path: '.env.local', quiet: true }));
	const args = process.argv.slice(2);
	if (
		args.some((arg) => !['--apply', '--dry-run'].includes(arg)) ||
		(args.includes('--apply') && args.includes('--dry-run'))
	) {
		throw new Error(
			'Usage: npx tsx scripts/migrate-group-boards-to-tutorial.ts [--dry-run | --apply]',
		);
	}
	const { prisma } = await import('../src/lib/prisma');
	try {
		const report = await migrateLegacyGroupBoards(prisma, args.includes('--apply'));
		const reportPath = resolve(`group-migration-${Date.now()}.json`);
		await writeFile(reportPath, JSON.stringify(report, null, 2), { mode: 0o600, flag: 'wx' });
		console.log(JSON.stringify(report, null, 2));
		console.log(`Report: ${reportPath}`);
		if (report.issues.length) process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}
main().catch((error: unknown) => {
	console.error(error);
	process.exitCode = 1;
});
