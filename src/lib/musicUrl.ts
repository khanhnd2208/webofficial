import { MESSAGE_MUSIC_TRACKS } from '@/constants/message';

/** Canonical URL for Gác Lại Âu Lo (renamed from Unicode filename). */
export const GAC_LAI_AU_LO_URL = '/music/gac-lai-au-lo.mp3';

/**
 * Legacy musicTrack values → canonical playable URL.
 * Covers NFD/NFC Unicode filenames macOS may produce.
 */
const LEGACY_MUSIC_URL_MAP: Record<string, string> = {
	'/music/Ga%CC%81c%20La%CC%A3i%20A%CC%82u%20Lo.mp3': GAC_LAI_AU_LO_URL,
	'/music/G%C3%A1c%20L%E1%BA%A1i%20%C3%82u%20Lo.mp3': GAC_LAI_AU_LO_URL,
	'global:Gác Lại Âu Lo.mp3': GAC_LAI_AU_LO_URL,
	'global:Ga\u0301c La\u0323i A\u0302u Lo.mp3': GAC_LAI_AU_LO_URL,
};

/** Build a safe public URL for a filename in public/music/. */
export function musicFilenameToUrl(filename: string): string {
	return `/music/${encodeURIComponent(filename)}`;
}

/** Normalize a music path/URL for legacy lookup (NFC + lowercase path). */
function normalizeMusicPath(path: string): string {
	try {
		const decoded = decodeURIComponent(path);
		return decoded.normalize('NFC');
	} catch {
		return path.normalize('NFC');
	}
}

/**
 * Resolve musicTrack DB value (preset id, URL, or legacy Unicode path) to playable URL.
 */
export function resolveMusicUrl(track?: string): string | undefined {
	if (!track) return undefined;

	// Direct legacy map (exact match)
	if (LEGACY_MUSIC_URL_MAP[track]) return LEGACY_MUSIC_URL_MAP[track];

	// Preset id
	const preset = MESSAGE_MUSIC_TRACKS.find((t) => t.id === track);
	if (preset) return preset.url;

	if (track.startsWith('/')) {
		// Legacy Unicode filename URLs (NFD/NFC) → canonical slug
		const normalized = normalizeMusicPath(track);
		if (normalized.includes('Gác Lại Âu Lo') || normalized.toLowerCase().includes('gác lại âu lo')) {
			return GAC_LAI_AU_LO_URL;
		}
		return track;
	}

	return track;
}

/** Human-readable label for a musicTrack value. */
export function getMusicTrackLabel(trackId?: string): string {
	if (!trackId) return 'Nhạc nền';
	const url = resolveMusicUrl(trackId);
	const preset = MESSAGE_MUSIC_TRACKS.find((t) => t.id === trackId || t.url === trackId || t.url === url);
	if (preset) return preset.label;
	if (url === GAC_LAI_AU_LO_URL) return 'Gác Lại Âu Lo';
	const parts = (url ?? trackId).split('/');
	const name = parts[parts.length - 1] ?? '';
	try {
		return decodeURIComponent(name).replace(/\.[^.]+$/, '');
	} catch {
		return name.replace(/\.[^.]+$/, '').replace(/-/g, ' ');
	}
}
