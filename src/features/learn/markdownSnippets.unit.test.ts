import { describe, expect, it } from 'vitest';

import { CALLOUT_MARKER_RE, resolveCalloutKind } from './callouts';
import { discussionQuestionViews } from './discussionView';
import { parseCourseMarkdown } from './lessonImport';
import {
	CALLOUT_SNIPPETS,
	CARET,
	IMPORT_SNIPPETS,
	insertSnippet,
	READING_SNIPPETS,
	snippetText,
} from './markdownSnippets';

const snippet = (id: string) =>
	[...READING_SNIPPETS, ...CALLOUT_SNIPPETS, ...IMPORT_SNIPPETS].find((item) => item.id === id)!;

describe('markdown snippets are what the parser reads', () => {
	it('every callout snippet resolves to its own kind', () => {
		for (const item of CALLOUT_SNIPPETS) {
			const marker = CALLOUT_MARKER_RE.exec(snippetText(item).replace(/^>\s*/, ''));
			expect(marker, item.id).not.toBeNull();
			expect(`callout-${resolveCalloutKind(marker![1])}`).toBe(item.id);
		}
	});

	it('the import snippets become one reading, one quiz and one discussion section', () => {
		const markdown = ['# Bài mẫu', ...IMPORT_SNIPPETS.map((item) => snippetText(item))].join(
			'\n\n',
		);
		const course = parseCourseMarkdown(markdown);
		const sections = course.lessons[0].sections;
		expect(sections.map((section) => section.type)).toEqual(['READING', 'QUIZ', 'DISCUSSION']);
		expect(sections[1].quiz?.questions).toHaveLength(1);
		expect(sections[1].quiz?.questions[0].options).toHaveLength(2);
		const discussion = sections[2].discussion!.questions;
		expect(discussion).toHaveLength(1);
		expect(discussion[0].answer).toContain('Lời giải');
		const [view] = discussionQuestionViews(discussion.map((item) => item.question));
		expect(view.blocks.map((block) => block.label)).toContain('Câu hỏi');
	});
});

describe('insertSnippet', () => {
	it('puts a block on its own paragraph and the caret inside it', () => {
		const result = insertSnippet('Đoạn trước', 10, 10, snippet('h2'));
		expect(result.value).toBe('Đoạn trước\n\n## ');
		expect(result.caret).toBe(result.value.length);
	});

	it('wraps the selection for inline snippets', () => {
		const result = insertSnippet('một từ khóa', 4, 6, snippet('bold'));
		expect(result.value).toBe('một **từ** khóa');
		expect(result.value.slice(0, result.caret)).toBe('một **từ');
	});

	it('keeps the text after the cursor separated by a blank line', () => {
		const result = insertSnippet('A\nB', 1, 1, snippet('callout-tip'));
		expect(result.value).toBe('A\n\n> [!TIP]\n> \n\nB');
		expect(result.value).not.toContain(CARET);
	});
});
