import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';

import { BRAND_COLORS, SOCIAL_IMAGE_SIZE } from '@/config/brandTokens';

/** Shared social composition. Text is rendered from source, never baked into AI artwork. */
export async function createSocialImage({
	title,
	kicker,
	description,
	artPath,
	dark = false,
}: {
	title: string;
	kicker: string;
	description: string;
	artPath: string;
	dark?: boolean;
}) {
	const [regular, semibold, source] = await Promise.all([
		readFile(join(process.cwd(), 'src/assets/fonts/source-serif/SourceSerif4-Regular.ttf')),
		readFile(join(process.cwd(), 'src/assets/fonts/source-serif/SourceSerif4-Semibold.ttf')),
		readFile(join(process.cwd(), 'public', artPath)),
	]);
	const art = await sharp(source)
		.resize(460, 510, {
			fit: dark ? 'cover' : 'contain',
			position: 'left',
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		})
		.png()
		.toBuffer();
	const paper = dark ? BRAND_COLORS.darkPaper : BRAND_COLORS.paper;
	const ink = dark ? BRAND_COLORS.darkInk : BRAND_COLORS.ink;
	const accent = dark ? BRAND_COLORS.darkAccent : BRAND_COLORS.bronze;
	const response = new ImageResponse(
		<div
			style={{
				display: 'flex',
				width: '100%',
				height: '100%',
				background: paper,
				color: ink,
				padding: 60,
				fontFamily: 'Source Serif',
				alignItems: 'center',
				gap: 40,
			}}
		>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					width: 580,
					height: '100%',
					justifyContent: 'space-between',
				}}
			>
				<div style={{ display: 'flex', color: accent, fontSize: 23, letterSpacing: 1.4 }}>
					DUY KHÁNH · {kicker}
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
					<div
						style={{
							display: 'flex',
							fontSize: 68,
							lineHeight: 1.08,
							fontWeight: 600,
							letterSpacing: -2,
						}}
					>
						{title}
					</div>
					<div style={{ display: 'flex', fontSize: 28, lineHeight: 1.4 }}>{description}</div>
				</div>
				<div style={{ display: 'flex', fontSize: 21, color: accent }}>toiladuykhanh.com</div>
			</div>
			{/* Native img is required by the ImageResponse renderer. */}
			<img
				src={`data:image/png;base64,${art.toString('base64')}`}
				width={460}
				height={510}
				alt=""
				style={{ objectFit: 'contain' }}
			/>
		</div>,
		{
			...SOCIAL_IMAGE_SIZE,
			fonts: [
				{ name: 'Source Serif', data: regular, weight: 400, style: 'normal' },
				{ name: 'Source Serif', data: semibold, weight: 600, style: 'normal' },
			],
		},
	);
	const png = Buffer.from(await response.arrayBuffer());
	let jpeg = await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
	for (const quality of [78, 70, 62]) {
		if (jpeg.length < 150_000) break;
		jpeg = await sharp(png).jpeg({ quality, mozjpeg: true }).toBuffer();
	}
	if (jpeg.length >= 150_000) throw new Error('Social image exceeds the 150 KB brand budget');
	return new Response(new Uint8Array(jpeg), { headers: { 'Content-Type': 'image/jpeg' } });
}
