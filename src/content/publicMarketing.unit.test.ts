import { describe, expect, it } from 'vitest';

import { contactChannels, corePositioning, introPage } from './publicMarketing';

describe('public marketing content', () => {
	it('keeps personal positioning for schema and shared surfaces', () => {
		expect(corePositioning.full).toContain('Nguyễn Duy Khánh');
		expect(corePositioning.promise).toContain('dạy quản trị');
		expect(corePositioning.promise).toContain('AI');
		expect(corePositioning.full).not.toContain('không thay thế tư duy');
	});

	it('keeps the intro cover short and dictionary-like', () => {
		expect(introPage.headline).toBe('Trở thành');
		expect(introPage.partOfSpeech).toBe('[động từ]');
		expect(introPage.cta).toBe('Mở mục lục');
		expect(introPage.lines).toEqual(['Chưa xong.', 'Và có lẽ, đó mới là điều hay.']);
		expect(introPage.year).toBe('2026');
	});

	it('offers Email, LinkedIn and Instagram as direct channels', () => {
		expect(contactChannels.map((channel) => channel.id)).toEqual(['email', 'linkedin', 'instagram']);
		expect(contactChannels[1].href).toBe('https://www.linkedin.com/in/khanhnguyenduy/');
	});
});
