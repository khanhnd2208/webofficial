import { describe, expect, it } from 'vitest';

import {
	aboutClosing,
	aboutCredentials,
	aboutHero,
	aboutJourney,
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
	it('opens with a named hero profile and journey quote', () => {
		expect(aboutHero.name).toBe('Khánh');
		expect(aboutHero.fullName).toBe('Nguyễn Duy Khánh');
		expect(aboutHero.greeting).toBe('Xin chào, mình là');
		expect(aboutHero.quote).toContain('making education an art');
		expect(aboutHero.manifesto).toBe(
			'Tôi vẫn đang học cách trở thành một người thầy tốt hơn.',
		);
		expect(corePositioning.full).toContain('Nguyễn Duy Khánh');
	});

	it('maps the journey as current work, classrooms, and projects', () => {
		expect(aboutJourney.title).toBe('Lớp học, công việc và những thử nghiệm');
		expect(aboutJourney.currentWork.title).toBe('Công việc hiện tại');
		expect(aboutJourney.currentWork.items.map((item) => item.title)).toEqual([
			'Giảng dạy',
			'Thiết kế trải nghiệm học',
			'Ứng dụng AI tạo sinh',
		]);
		expect(aboutJourney.classrooms.items).toHaveLength(6);
		expect(aboutJourney.classrooms.items[0]).toBe('Đại học Hà Nội');
		expect(aboutJourney.projects.items.map((item) => item.id)).toEqual([
			'mini-erp',
			'moonie',
			'wang',
			'hanoicam',
			'kiddogo',
		]);
	});

	it('closes with an applied-idea quote and quiet credentials', () => {
		expect(aboutClosing.quote).toContain('hiểu rõ và dùng được');
		expect(aboutCredentials.items).toEqual([
			'Giảng viên, Khoa Quản trị Kinh doanh và Du lịch',
			'Trường Đại học Hà Nội · Hà Nội, Việt Nam',
		]);
		expect(aboutCredentials.closing).toBe('Tôi dạy, học và viết từ Hà Nội.');
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
