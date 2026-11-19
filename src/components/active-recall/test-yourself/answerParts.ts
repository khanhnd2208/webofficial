import DOMPurify from 'isomorphic-dompurify';

const EXAMPLE_LABEL = /^\s*(?:for example|example|e\.g\.|ví dụ|vd)\s*[:.]\s*/i;
export type AnswerParts = { main: string; example: string };

/** Stored cards use both new paragraphs and soft line breaks before an example. */
export function splitAnswerExample(html: string): AnswerParts {
	const whole = { main: html, example: '' };
	if (!/(?:example|ví dụ|e\.g\.|\bvd\b)/i.test(html)) return whole;
	const body = DOMPurify.sanitize(html, { RETURN_DOM: true }) as HTMLElement;
	const doc = body.ownerDocument;
	for (const boundary of body.querySelectorAll(':scope > p, :scope > p br')) {
		const remainder = doc.createRange();
		remainder.selectNodeContents(boundary.closest('p')!);
		if (boundary.tagName === 'BR') remainder.setStartAfter(boundary);
		const label = EXAMPLE_LABEL.exec(remainder.toString());
		if (!label) continue;

		const point = doc.createRange();
		point.selectNodeContents(body);
		point.setEndBefore(boundary);
		if (!point.toString().trim()) return whole;
		const main = doc.createElement('div');
		main.append(point.cloneContents());

		const exampleRange = doc.createRange();
		exampleRange.selectNodeContents(body);
		exampleRange.setStart(remainder.startContainer, remainder.startOffset);
		const example = doc.createElement('div');
		example.append(exampleRange.cloneContents());
		// The label, colon and whitespace can be in separate formatting nodes.
		let remaining = label[0].length;
		const walker = doc.createTreeWalker(example, 4 /* SHOW_TEXT */);
		while (remaining > 0 && walker.nextNode()) {
			const node = walker.currentNode as Text;
			const count = Math.min(node.length, remaining);
			node.deleteData(0, count);
			remaining -= count;
		}
		example.normalize();
		for (const empty of example.querySelectorAll('strong:empty, b:empty, em:empty, i:empty'))
			empty.remove();
		return { main: main.innerHTML, example: example.innerHTML };
	}
	return whole;
}
