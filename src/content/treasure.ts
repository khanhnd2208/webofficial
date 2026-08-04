/**
 * My Treasure — authentic learner relationship evidence.
 * Render only when ≥ TREASURE_PUBLIC_MIN items have permission and are anonymized.
 * Never invent quotes or edit meaning.
 */

export const TREASURE_PUBLIC_MIN = 3;

export type TreasureKind = 'letter' | 'message' | 'gift' | 'classroom' | 'handwriting' | 'other';

export type TreasureItem = {
	id: string;
	kind: TreasureKind;
	caption: string;
	quote?: string;
	image?: string;
	permissionGranted: boolean;
	anonymized: boolean;
};

/**
 * Intentionally empty until the owner supplies real, permissioned artefacts.
 * Do not add placeholders.
 */
export const treasureItems: TreasureItem[] = [];

export const treasureSection = {
	eyebrow: 'My Treasure',
	title: 'Những điều người học để lại',
	lead: 'Không phải lời chứng thực. Đây là những mảnh nhỏ cho thấy mối quan hệ giữa tôi và người học có thật.',
} as const;

export function isPublishableTreasure(item: TreasureItem): boolean {
	return item.permissionGranted && item.anonymized;
}

export function getPublishableTreasure(): TreasureItem[] {
	return treasureItems.filter(isPublishableTreasure);
}

export function isTreasurePublic(): boolean {
	return getPublishableTreasure().length >= TREASURE_PUBLIC_MIN;
}
