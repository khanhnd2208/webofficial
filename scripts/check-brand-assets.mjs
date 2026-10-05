import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import sharp from 'sharp';

// Check assets introduced by this branch; older originals are retained for review.
const files = new Set(
	[
		execFileSync('git', ['diff', '--name-only', 'origin/main'], { encoding: 'utf8' }),
		execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { encoding: 'utf8' }),
	]
		.join('\n')
		.split('\n')
		.filter((file) => /^(public\/brand\/|src\/app\/).*\.(webp|avif|jpe?g|png)$/i.test(file)),
);

for (const file of files) {
	const { size } = await stat(file);
	if (size > 300_000) throw new Error(`${file} exceeds 300 KB`);
	const metadata = await sharp(await readFile(file)).metadata();
	if (file === 'src/app/icon.png' && (metadata.width !== 512 || metadata.height !== 512)) {
		throw new Error('App icon must be 512 × 512');
	}
	if (file === 'src/app/apple-icon.png' && (metadata.width !== 180 || metadata.height !== 180)) {
		throw new Error('Apple icon must be 180 × 180');
	}
	console.log(`${file}: ${metadata.width} × ${metadata.height}, ${size} bytes`);
}

const origin = process.argv[2];
if (origin) {
	for (const route of ['', '/gioi-thieu', '/kham-pha-khoa-hoc', '/my-space/board-game']) {
		const response = await fetch(new URL(`${route}/opengraph-image`, origin));
		if (!response.ok) throw new Error(`Social image failed: ${route}, ${response.status}`);
		const bytes = Buffer.from(await response.arrayBuffer());
		const metadata = await sharp(bytes).metadata();
		if (metadata.width !== 1200 || metadata.height !== 630 || bytes.length >= 150_000) {
			throw new Error(`Social image violates its size budget: ${route}`);
		}
		console.log(`${route || '/'} social image: 1200 × 630, ${bytes.length} bytes`);
	}
}

console.log(`Checked ${files.size} new or updated raster assets.`);
