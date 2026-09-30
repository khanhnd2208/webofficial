import { describe, expect, it } from 'vitest';

import {
	recallHasContent,
	recallHtmlToMarkdown,
	recallImportToStoredHtml,
	recallMarkdownToHtml,
	recallToStoredHtml,
	recallVisibleText,
	sanitizeRecallHtml,
} from './richText';

describe('Active Recall rich text', () => {
	it('converts common markdown and inline HTML to safe stored HTML', () => {
		const html = recallMarkdownToHtml(
			'What is **HRM**?\nA *system*\n<u>underlined</u>\n<span style="color: #dc2626">red</span>',
		);

		expect(html).toContain('<strong>HRM</strong>');
		expect(html).toContain('<em>system</em>');
		expect(html).toContain('<u>underlined</u>');
		expect(html).toContain('<span style="color: #dc2626">red</span>');
	});

	it('round-trips nested underline and color without leaking internal tokens', () => {
		const source =
			'What is <u><span style="color: #dc2626">HRM</span></u> and <span style="color: #dc2626"><u>risk</u></span>?';
		const html = recallMarkdownToHtml(source);
		expect(html).toContain('<u><span style="color: #dc2626">HRM</span></u>');
		expect(html).toContain('<span style="color: #dc2626"><u>risk</u></span>');
		expect(html).not.toContain('\u0000');

		const markdown = recallHtmlToMarkdown(html);
		expect(markdown).toContain('<u><span style="color: #dc2626">HRM</span></u>');
		expect(markdown).toContain('<span style="color: #dc2626"><u>risk</u></span>');
		expect(markdown).not.toContain('\u0000');
		expect(recallVisibleText(recallMarkdownToHtml(markdown))).toBe(recallVisibleText(html));
	});

	it('round-trips every supported nested inline mark combination', () => {
		const wrap = (tag: string, value: string) =>
			tag === 'span' ? `<span style="color: #dc2626">${value}</span>` : `<${tag}>${value}</${tag}>`;
		const marks = ['strong', 'em', 'u', 'span'];

		for (let mask = 0; mask < 2 ** marks.length; mask += 1) {
			let value = 'text';
			for (const [index, tag] of marks.entries()) {
				if (mask & (1 << index)) value = wrap(tag, value);
			}
			const stored = sanitizeRecallHtml(`<p>${value}</p>`);
			const restored = recallImportToStoredHtml(recallHtmlToMarkdown(stored));
			expect(recallVisibleText(restored)).toBe(recallVisibleText(stored));
			expect(restored).not.toContain('\\u0000');
		}
	});

	it('keeps spaces between adjacent formatted words', () => {
		const html = sanitizeRecallHtml('<p><strong>Human</strong> <em>resources</em></p>');
		expect(html).toContain('<strong>Human</strong> <em>resources</em>');
		expect(recallVisibleText(html)).toBe('Human resources');
	});

	it('round-trips supported formatting through markdown export', () => {
		const source = [
			'What is **HRM**?',
			'A *system*',
			'<u>underlined</u>',
			'<span style="color: #dc2626">red</span>',
			'',
			'- one',
			'- two',
		].join('\n');
		const html = recallMarkdownToHtml(source);
		const markdown = recallHtmlToMarkdown(html);

		expect(markdown).toContain('**HRM**');
		expect(markdown).toContain('*system*');
		expect(markdown).toContain('<u>underlined</u>');
		expect(markdown).toContain('<span style="color: #dc2626">red</span>');
		expect(markdown).toContain('- one');
		expect(markdown).toContain('- two');
		expect(recallVisibleText(recallMarkdownToHtml(markdown))).toBe(recallVisibleText(html));
	});

	it('does not treat literal filenames or multiplication as markdown', () => {
		expect(recallMarkdownToHtml('See file_name_test and 2 * 3 * 4')).toContain('file_name_test');
		expect(recallMarkdownToHtml('See file_name_test and 2 * 3 * 4')).toContain('2 * 3 * 4');
		expect(recallMarkdownToHtml('See file_name_test and 2 * 3 * 4')).not.toContain('<em>');
		expect(recallMarkdownToHtml('<strong>Human</strong> <em>resources</em>')).toContain(
			'<strong>Human</strong> <em>resources</em>',
		);

		const stored = recallToStoredHtml('See file_name_test and 2 * 3 * 4');
		expect(stored).toBe('<p>See file_name_test and 2 * 3 * 4</p>');
		const exported = recallHtmlToMarkdown(stored);
		expect(recallVisibleText(recallImportToStoredHtml(exported))).toBe(
			'See file_name_test and 2 * 3 * 4',
		);
	});

	it('keeps legacy plain text readable and treats formatting-only markup as empty', () => {
		expect(recallToStoredHtml('What is HRM?')).toBe('<p>What is HRM?</p>');
		expect(recallVisibleText('What is HRM?')).toBe('What is HRM?');
		expect(recallHasContent('<p></p>')).toBe(false);
		expect(recallHasContent('<p><br></p>')).toBe(false);
	});

	it('strips scripts, event handlers, overlay CSS and disallowed colors', () => {
		const html = sanitizeRecallHtml(
			'<p style="position:fixed;inset:0;background:red">Safe <strong>text</strong><script>alert(1)</script><img src=x onerror=alert(1)><span style="color: #ff00ff">pink</span></p>',
		);

		expect(html).toContain('<strong>text</strong>');
		expect(html).not.toContain('script');
		expect(html).not.toContain('img');
		expect(html).not.toContain('#ff00ff');
		expect(html).not.toContain('position');
		expect(html).not.toContain('fixed');
		expect(html).not.toContain('background');
		expect(html).toContain('pink');
	});

	it('sanitizes already stored Tiptap HTML without re-escaping marks', () => {
		const stored = '<p>What is <strong>HRM</strong>?</p><ul><li><p>policy</p></li></ul>';
		expect(recallToStoredHtml(stored)).toContain('<strong>HRM</strong>');
		expect(recallToStoredHtml(stored)).toContain('<li>policy</li>');
	});
});
