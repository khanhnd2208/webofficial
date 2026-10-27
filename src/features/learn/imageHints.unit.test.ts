import { describe, expect, it } from 'vitest';

import { addImageSlots, findImageHints, imageHintFor } from './imageHints';
import { findImageRefs } from './images';

describe('image hints', () => {
	it('recognises captions and picture notes copied without their picture', () => {
		expect(imageHintFor('Hình 2.1: Quy trình lập kế hoạch')?.kind).toBe('caption');
		expect(imageHintFor('*Hình 2.2 – Ma trận SWOT*')).toEqual({
			kind: 'caption',
			alt: 'Hình 2.2 – Ma trận SWOT',
		});
		expect(imageHintFor('Sơ đồ 3. Cơ cấu tổ chức')?.kind).toBe('caption');
		expect(imageHintFor('Figure 4: Market share')?.kind).toBe('caption');
		expect(imageHintFor('[Hình ảnh: sơ đồ tổ chức]')).toEqual({
			kind: 'placeholder',
			alt: 'Hình ảnh: sơ đồ tổ chức',
		});
		expect(imageHintFor('(Chèn hình minh họa ở đây)')?.kind).toBe('placeholder');
	});

	it('matches decomposed Vietnamese text pasted from macOS', () => {
		expect(imageHintFor('Hình 1: Mô hình'.normalize('NFD'))?.kind).toBe('caption');
	});

	it('leaves ordinary sentences and links alone', () => {
		expect(imageHintFor('Hình 1 cho thấy doanh thu tăng.')).toBeNull();
		expect(imageHintFor('Hình thức tổ chức: tập trung')).toBeNull();
		expect(imageHintFor('[Hình 1](https://example.com/a)')).toBeNull();
		expect(imageHintFor('Ảnh hưởng của văn hóa')).toBeNull();
	});

	it('skips captions next to a picture, a diagram, inside code or inside a paragraph', () => {
		const md = [
			'![Có ảnh](/a.webp)',
			'',
			'Hình 1: đã có ảnh',
			'',
			'```mermaid',
			'flowchart LR',
			'```',
			'',
			'Sơ đồ 2: đã có sơ đồ',
			'',
			'```text',
			'Hình 3: trong khối mã',
			'```',
			'',
			'Đoạn văn',
			'Hình 4: dính vào đoạn',
			'',
			'> Hình 5: trong trích dẫn',
		].join('\n');
		expect(findImageHints(md)).toEqual([]);
	});

	it('adds an empty slot above a caption and turns a note into a slot', () => {
		const md = 'Mở đầu.\n\nHình 1: Quy trình [A]\n\n[Chèn hình minh họa]\n\nKết.';
		const out = addImageSlots(md);
		expect(out).toBe(
			'Mở đầu.\n\n![Hình 1: Quy trình \\[A\\]]()\n\nHình 1: Quy trình [A]\n\n![Chèn hình minh họa]()\n\nKết.',
		);
		expect(findImageRefs(out).map((ref) => ref.status)).toEqual(['missing', 'missing']);
		expect(findImageHints(out)).toEqual([]);
	});
});
