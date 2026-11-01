import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { discussionMarkdown, parseDiscussionPaste } from './discussionImport';

const root = path.join(process.cwd(), 'content/learn');
const files = readdirSync(root, { recursive: true, encoding: 'utf8' })
	.filter((file) => file.endsWith('-them.md'))
	.sort();

/** Learn Studio edits a question bank as the Markdown discussionMarkdown writes, so it must read back unchanged. */
describe('discussion Markdown round trip', () => {
	it.each(files)('%s keeps every question and answer', (file) => {
		const { questions } = parseDiscussionPaste(readFileSync(path.join(root, file), 'utf8'));
		expect(questions.length).toBeGreaterThan(0);
		const again = parseDiscussionPaste(discussionMarkdown({ questions })).questions;
		expect(again.map(({ question, answer }) => ({ question, answer }))).toEqual(
			questions.map(({ question, answer }) => ({ question, answer })),
		);
	});
});
