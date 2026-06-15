export interface MusicTrackDTO {
	id: string;
	label: string;
	url: string;
	source: 'preset' | 'global' | 'upload';
	canDelete?: boolean;
}
