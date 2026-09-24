/**
 * Cheap, syntax-level scan for source markdown the studio's visual editor doesn't (yet)
 * preserve on a round trip — footnotes, task-list checkboxes, raw HTML tags. Used to keep
 * a mode switch from silently discarding content the editor can't represent; it isn't a
 * full parser, just a safety net over known gaps.
 */

interface FidelityCheck {
	label: string;
	test: RegExp;
}

const CHECKS: FidelityCheck[] = [
	{ label: 'chú thích nguồn (footnote [^…])', test: /\[\^[^\]]+\]/ },
	{ label: 'việc cần làm (- [ ] / - [x])', test: /^[ \t]*[-*][ \t]+\[[ xX]\][ \t]/m },
	{ label: 'thẻ HTML (<u>, <sup>, <sub>, <mark>…)', test: /<\/?(u|sup|sub|mark|kbd|ins|abbr)\b/i },
];

export function findUnsupportedMarkdown(markdown: string): string[] {
	return CHECKS.filter((check) => check.test.test(markdown)).map((check) => check.label);
}
