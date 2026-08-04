import { describe, expect, it } from 'vitest';

import {
	aboutBeyond,
	aboutClosing,
	aboutCredentials,
	aboutHero,
	aboutPath,
	aboutPrinciples,
	aboutWorkToday,
} from './about';
import { NOTES_PUBLIC_MIN, areNotesPublic, getPublishedNotes, notes } from './notes';
import {
	TREASURE_PUBLIC_MIN,
	getPublishableTreasure,
	isTreasurePublic,
	treasureItems,
} from './treasure';
import { corePositioning } from './publicMarketing';

describe('about content', () => {
	it('opens a story that does not repeat the homepage learning manifesto', () => {
		expect(aboutHero.title).toBe('Con đường của tôi luôn quay trở lại lớp học.');
		expect(aboutHero.lead).not.toContain('Nguyễn Duy Khánh');
		expect(aboutHero.title).not.toContain('tiếp tục học');
		expect(corePositioning.manifesto).toContain('tiếp tục học');
		expect(corePositioning.full).not.toContain('không thay thế tư duy');
		expect(aboutPrinciples.items.find((item) => item.id === 'human')?.body).toContain(
			'đánh giá, lựa chọn và chịu trách nhiệm',
		);
	});

	it('keeps three grounded chapters as the spine of the page', () => {
		expect(aboutPath.chapters).toHaveLength(3);
		for (const chapter of aboutPath.chapters) {
			expect(chapter.milestone.length).toBeGreaterThan(20);
			expect(chapter.body).not.toMatch(/tạm thời|sẽ bổ sung|đang chờ/i);
		}
		expect(aboutPath.chapters[0]?.milestone).toContain('Khoa Quản trị');
	});

	it('collapses current work into one statement plus deep links', () => {
		expect(aboutWorkToday.body).toContain('ba nơi');
		expect(aboutWorkToday.links).toHaveLength(3);
		expect(aboutWorkToday.links.map((link) => link.label)).toEqual([
			'Những lớp học đang diễn ra',
			'Các dự án thiết kế học tập',
			'Những nghiên cứu và thử nghiệm mới',
		]);
	});

	it('gates beyond-classroom surfaces until content is reachable', () => {
		expect(aboutBeyond.reading.items).toHaveLength(0);
		expect(aboutBeyond.hanoicam.title).toBe('My Hanoicam');
		expect(aboutCredentials.items[3]?.label).toBe('Mối quan tâm nghiên cứu hiện tại');
	});

	it('aligns closing CTAs with notes availability', () => {
		expect(aboutClosing.primaryCta.hrefKey).toBe('projects');
		expect(aboutClosing.contactCta.hrefKey).toBe('contact');
		expect(aboutClosing.notesCta.hrefKey).toBe('notes');
		expect(aboutClosing.titleWithoutNotes).toContain('cuộc trò chuyện mới');
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
