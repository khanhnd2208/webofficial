export interface MessageMusicTrack {
	id: string;
	label: string;
	url: string;
}

export interface MessageDisplayFont {
	id: string;
	label: string;
	/** Full CSS font-family stack — used directly in style={{ fontFamily }}. */
	fontStack: string;
	/** CSS variable name (only for Google Fonts loaded via next/font). */
	cssVar?: string;
	previewText: string;
	category: 'sans' | 'serif';
}

/** Built-in preset tracks in public/music/ */
export const MESSAGE_MUSIC_TRACKS: MessageMusicTrack[] = [
	{ id: 'lofi-rain', label: 'Lofi Rain', url: '/music/lofi-rain.mp3' },
	{ id: 'piano-gentle', label: 'Piano nhẹ nhàng', url: '/music/piano-gentle.mp3' },
	{ id: 'cafe-ambient', label: 'Cafe Ambient', url: '/music/cafe-ambient.mp3' },
];

export const MESSAGE_DISPLAY_FONTS: MessageDisplayFont[] = [
	// ── System fonts ── instant, zero FOUT, always available ──────────────
	{
		id: 'arial',
		label: 'Arial',
		fontStack: 'Arial, Helvetica, sans-serif',
		previewText: 'Gửi em',
		category: 'sans',
	},
	{
		id: 'helvetica',
		label: 'Helvetica Neue',
		fontStack: '"Helvetica Neue", Helvetica, Arial, sans-serif',
		previewText: 'Gửi em',
		category: 'sans',
	},
	{
		id: 'times-new-roman',
		label: 'Times New Roman',
		fontStack: '"Times New Roman", Times, Georgia, serif',
		previewText: 'Gửi em',
		category: 'serif',
	},
	// ── Google Fonts ── verified Vietnamese subset, display: block ─────────
	{
		id: 'be-vietnam-pro',
		label: 'Be Vietnam Pro',
		cssVar: '--font-be-vietnam-pro',
		fontStack: 'var(--font-be-vietnam-pro), Arial, sans-serif',
		previewText: 'Gửi em',
		category: 'sans',
	},
	{
		id: 'inter',
		label: 'Inter',
		cssVar: '--font-inter',
		fontStack: 'var(--font-inter), Arial, sans-serif',
		previewText: 'Gửi em',
		category: 'sans',
	},
	{
		id: 'lora',
		label: 'Lora',
		cssVar: '--font-lora',
		fontStack: 'var(--font-lora), Georgia, "Times New Roman", serif',
		previewText: 'Gửi em',
		category: 'serif',
	},
	{
		id: 'source-serif',
		label: 'Source Serif 4',
		cssVar: '--font-source-serif',
		fontStack: 'var(--font-source-serif), Georgia, "Times New Roman", serif',
		previewText: 'Gửi em',
		category: 'serif',
	},
];

export const DEFAULT_DISPLAY_FONT = 'be-vietnam-pro';

/** Resolve musicTrack value (legacy id or URL) to playable URL */
export function resolveMusicUrl(track?: string): string | undefined {
	if (!track) return undefined;
	if (track.startsWith('/')) return track;
	const preset = MESSAGE_MUSIC_TRACKS.find((t) => t.id === track);
	return preset?.url ?? track;
}

export function getDisplayFontById(id: string | undefined): MessageDisplayFont {
	const fallback = MESSAGE_DISPLAY_FONTS[0];
	if (!id) return fallback;
	// Legacy font IDs from previous version — map to new ones
	const legacyMap: Record<string, string> = {
		'caveat': 'arial',
		'patrick-hand': 'arial',
		'mali': 'arial',
		'nunito': 'be-vietnam-pro',
		'playfair': 'lora',
		'dancing-script': 'lora',
	};
	const resolvedId = legacyMap[id] ?? id;
	return MESSAGE_DISPLAY_FONTS.find((f) => f.id === resolvedId) ?? fallback;
}

export function getDisplayFontFamily(id: string | undefined): string {
	return getDisplayFontById(id).fontStack;
}
