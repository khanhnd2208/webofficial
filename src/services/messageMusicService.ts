import { readdir, mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';

import dbConnect from '@/lib/dbConnect';
import { AppError } from '@/lib/appError';
import { MESSAGE_MUSIC_TRACKS } from '@/constants/message';
import { musicFilenameToUrl } from '@/lib/musicUrl';
import MessageMusic from '@/models/MessageMusic';
import type { MusicTrackDTO } from '@/types/messageMusic';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'music', 'uploads');
const GLOBAL_DIR = path.join(process.cwd(), 'public', 'music');

async function listGlobalTracksFromDisk(): Promise<MusicTrackDTO[]> {
	try {
		const entries = await readdir(GLOBAL_DIR, { withFileTypes: true });
		const presetUrls = new Set(MESSAGE_MUSIC_TRACKS.map((t) => t.url));
		return entries
			.filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.mp3'))
			.map((e) => {
				const filename = e.name;
				const url = musicFilenameToUrl(filename);
				const preset = MESSAGE_MUSIC_TRACKS.find((t) => t.url === url);
				return {
					id: `global:${filename}`,
					label: preset?.label ?? filename.replace(/\.mp3$/i, '').normalize('NFC'),
					url,
					source: 'global' as const,
				};
			})
			.filter((t) => !presetUrls.has(t.url));
	} catch (err) {
		console.error('[messageMusic] listGlobalTracksFromDisk failed:', err);
		return [];
	}
}

function listPresetTracks(): MusicTrackDTO[] {
	return MESSAGE_MUSIC_TRACKS.map((t) => ({
		id: t.id,
		label: t.label,
		url: t.url,
		source: 'preset' as const,
	}));
}

export async function listMusicTracksForUser(userId: string): Promise<MusicTrackDTO[]> {
	const presets = listPresetTracks();
	const globalTracks = await listGlobalTracksFromDisk();

	let uploadTracks: MusicTrackDTO[] = [];
	try {
		await dbConnect();
		const uploads = await MessageMusic.find({ userId }).sort({ createdAt: -1 }).lean();
		uploadTracks = uploads.map((doc) => ({
			id: String(doc._id),
			label: doc.label,
			url: doc.url,
			source: 'upload' as const,
			canDelete: true,
		}));
	} catch (err) {
		console.error('[messageMusic] list user uploads failed:', err);
	}

	return [...presets, ...globalTracks, ...uploadTracks];
}

export async function uploadMusicTrack(
	userId: string,
	file: File,
	label?: string,
): Promise<MusicTrackDTO> {
	if (!file.type.startsWith('audio/') && !file.name.toLowerCase().endsWith('.mp3')) {
		throw new AppError('Chỉ chấp nhận file MP3', 400);
	}

	const maxBytes = 15 * 1024 * 1024;
	if (file.size > maxBytes) {
		throw new AppError('File nhạc quá lớn (tối đa 15MB)', 400);
	}

	const userDir = path.join(UPLOADS_DIR, userId);
	await mkdir(userDir, { recursive: true });

	const storedName = `${Date.now()}-${Math.random().toString(16).slice(2)}.mp3`;
	const filePath = path.join(userDir, storedName);
	const bytes = Buffer.from(await file.arrayBuffer());
	await writeFile(filePath, bytes);

	const url = `/music/uploads/${userId}/${storedName}`;
	const displayLabel = label?.trim() || file.name.replace(/\.mp3$/i, '');

	await dbConnect();
	const created = await MessageMusic.create({
		userId,
		label: displayLabel,
		url,
		filename: storedName,
	});

	return {
		id: String(created._id),
		label: created.label,
		url: created.url,
		source: 'upload',
		canDelete: true,
	};
}

export async function deleteMusicTrack(userId: string, trackId: string): Promise<void> {
	await dbConnect();
	const doc = await MessageMusic.findOne({ _id: trackId, userId });
	if (!doc) throw new AppError('Không tìm thấy file nhạc', 404);

	const filePath = path.join(UPLOADS_DIR, userId, doc.filename);
	try {
		await unlink(filePath);
	} catch {
		/* file may already be gone */
	}

	await MessageMusic.deleteOne({ _id: trackId, userId });
}
