import { describe, expect, it } from 'vitest';

import { aboutCollaboration, aboutHero } from './about';
import { NOTES_PUBLIC_MIN, areNotesPublic, getPublishedNotes, notes } from './notes';
import {
	TREASURE_PUBLIC_MIN,
	getPublishableTreasure,
	isTreasurePublic,
	treasureItems,
} from './treasure';
import { corePositioning } from './publicMarketing';

describe('about content', () => {
	it('opens with who Khánh is, where he teaches, and what he offers', () => {
		expect(aboutHero.fullName).toBe('Nguyễn Duy Khánh');
		expect(aboutHero.organisation).toBe('Trường Đại học Hà Nội');
		expect(aboutHero.promise).toContain('quản trị');
		expect(aboutHero.pillars).toEqual(['Quản trị', 'Thiết kế học tập', 'AI ứng dụng']);
		expect(corePositioning.full).toContain('Nguyễn Duy Khánh');
	});

	it('lists three ways to work together', () => {
		expect(aboutCollaboration.items.map((item) => item.title)).toEqual([
			'Đào tạo quản trị',
			'Ứng dụng AI vào công việc',
			'Học tập và tiếng Anh',
		]);
	});
});

describe('notes gating', () => {
	it('keeps seed notes draft until the owner publishes enough work', () => {
		expect(notes).toHaveLength(3);
		expect(notes.every((note) => note.status === 'draft')).toBe(true);
		expect(getPublishedNotes()).toHaveLength(0);
		expect(areNotesPublic()).toBe(false);
		expect(NOTES_PUBLIC_MIN).toBe(3);
	});
});

describe('treasure gating', () => {
	it('stays empty until permissioned artefacts exist', () => {
		expect(treasureItems).toHaveLength(0);
		expect(getPublishableTreasure()).toHaveLength(0);
		expect(isTreasurePublic()).toBe(false);
		expect(TREASURE_PUBLIC_MIN).toBe(3);
	});
});
