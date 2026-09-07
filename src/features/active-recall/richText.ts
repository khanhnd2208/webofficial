import DOMPurify from 'isomorphic-dompurify';

export const RECALL_TEXT_COLORS = [
	{ label: 'Mặc định', value: null },
	{ label: 'Slate', value: '#475569' },
	{ label: 'Đỏ', value: '#dc2626' },
	{ label: 'Cam', value: '#ea580c' },
	{ label: 'Vàng đậm', value: '#ca8a04' },
	{ label: 'Xanh lá', value: '#15803d' },
	{ label: 'Xanh dương', value: '#2563eb' },
	{ label: 'Tím', value: '#7c3aed' },
	{ label: 'Hồng', value: '#db2777' },
] as const;

export const RECALL_ALLOWED_COLORS = new Set(
	RECALL_TEXT_COLORS.flatMap((color) => (color.value ? [color.value.toLowerCase()] : [])),
);

const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'ul', 'ol', 'li'];
const HTML_BLOCK_START = /^\s*<(p|ul|ol)\b/i;
const ALNUM = /[\p{L}\p{N}]/u;

type InlineNode =
	| { type: 'text'; value: string }
	| { type: 'br' }
	| { type: 'strong' | 'em' | 'u'; children: InlineNode[] }
	| { type: 'color'; color: string; children: InlineNode[] };

function escapeHtml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function decodeEntities(value: string) {
	return value
		.replace(/&nbsp;/gi, ' ')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}

function toHexColor(value: string) {
	const raw = value.trim().toLowerCase();
	if (RECALL_ALLOWED_COLORS.has(raw)) return raw;
	const rgb = raw.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
	if (!rgb) return null;
	const hex = `#${[rgb[1], rgb[2], rgb[3]]
		.map((part) => Number(part).toString(16).padStart(2, '0'))
		.join('')}`;
	return RECALL_ALLOWED_COLORS.has(hex) ? hex : null;
}

export function normalizeRecallColor(value: string | null | undefined) {
	return value ? toHexColor(value) : null;
}

function colorFromStyle(style: string | null | undefined) {
	return normalizeRecallColor(style?.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i)?.[1] ?? '');
}

function isElement(node: Node): node is Element {
	return node.nodeType === 1;
}

function unwrap(node: Element) {
	const parent = node.parentNode;
	if (!parent) return;
	while (node.firstChild) parent.insertBefore(node.firstChild, node);
	parent.removeChild(node);
}

function renameTag(el: Element, tag: string) {
	if (el.tagName.toLowerCase() === tag) return el;
	const next = el.ownerDocument.createElement(tag);
	while (el.firstChild) next.appendChild(el.firstChild);
	el.replaceWith(next);
	return next;
}

function cleanAttributes(el: Element) {
	const tag = el.tagName.toLowerCase();
	const color = tag === 'span' ? colorFromStyle(el.getAttribute('style')) : null;
	for (const attr of [...el.attributes]) {
		el.removeAttribute(attr.name);
	}
	if (color) el.setAttribute('style', `color: ${color}`);
	else if (tag === 'span') unwrap(el);
}

function normalizeTree(root: Element) {
	const visit = (node: Node) => {
		if (!isElement(node)) return;
		let el = node;
		const tag = el.tagName.toLowerCase();
		if (tag === 'b') el = renameTag(el, 'strong');
		if (tag === 'i') el = renameTag(el, 'em');
		cleanAttributes(el);
		if (!el.parentNode) return;
		for (const child of [...el.childNodes]) visit(child);
		if (el.tagName.toLowerCase() === 'li') {
			for (const child of [...el.children]) {
				if (child.tagName.toLowerCase() === 'p') unwrap(child);
			}
		}
	};
	for (const child of [...root.childNodes]) visit(child);
	for (const empty of [...root.querySelectorAll('p')]) {
		if (!empty.textContent?.trim() && !empty.querySelector('img')) {
			const onlyBreaks = [...empty.childNodes].every(
				(child) =>
					(child.nodeType === 3 && !child.textContent?.trim()) ||
					(isElement(child) && child.tagName.toLowerCase() === 'br'),
			);
			if (onlyBreaks) empty.remove();
		}
	}
}

function serializeInlineHtml(root: Element): string {
	return Array.from(root.childNodes)
		.map((node) => {
			if (node.nodeType === 3) return escapeHtml(node.textContent ?? '');
			if (!isElement(node)) return '';
			const tag = node.tagName.toLowerCase();
			if (tag === 'br') return '<br>';
			const inner = serializeInlineHtml(node);
			if (tag === 'span') {
				const color = colorFromStyle(node.getAttribute('style'));
				return color ? `<span style="color: ${color}">${inner}</span>` : inner;
			}
			if (['strong', 'em', 'u', 'p', 'ul', 'ol', 'li'].includes(tag)) {
				return `<${tag}>${inner}</${tag}>`;
			}
			return inner;
		})
		.join('');
}

export function sanitizeRecallHtml(html: string | null | undefined) {
	if (!html) return '';
	const body = DOMPurify.sanitize(html, {
		ALLOWED_TAGS,
		ALLOWED_ATTR: ['style'],
		ALLOW_DATA_ATTR: false,
		KEEP_CONTENT: true,
		RETURN_DOM: true,
	}) as unknown as HTMLElement;
	normalizeTree(body);
	return serializeInlineHtml(body)
		.replace(/<p>(?:\s|<br\s*\/?>)*<\/p>/gi, '')
		.trim();
}

export function recallVisibleText(html: string | null | undefined) {
	return decodeEntities(
		sanitizeRecallHtml(html)
			.replace(/<br\s*\/?>/gi, '\n')
			.replace(/<\/(p|li)>/gi, '\n')
			.replace(/<\/(ul|ol)>/gi, '\n')
			.replace(/<[^>]+>/g, ''),
	)
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

export function recallHasContent(html: string | null | undefined) {
	return recallVisibleText(html).length > 0;
}

export function recallVisibleLength(html: string | null | undefined) {
	return recallVisibleText(html).length;
}

export function isRecallStoredHtml(value: string) {
	return HTML_BLOCK_START.test(value.trim());
}

function charAt(source: string, index: number) {
	return index >= 0 && index < source.length ? source[index]! : '';
}

function canOpenEmphasis(source: string, index: number, marker: '*' | '_') {
	const next = charAt(source, index + 1);
	if (!next || /\s/.test(next)) return false;
	if (marker === '_') {
		const prev = charAt(source, index - 1);
		if (prev && ALNUM.test(prev) && ALNUM.test(next)) return false;
	}
	return true;
}

function canCloseEmphasis(source: string, index: number, marker: '*' | '_') {
	const prev = charAt(source, index - 1);
	if (!prev || /\s/.test(prev)) return false;
	if (marker === '_') {
		const next = charAt(source, index + 1);
		if (next && ALNUM.test(prev) && ALNUM.test(next)) return false;
	}
	return true;
}

function findClosing(source: string, start: number, delimiter: string) {
	let index = start;
	const marker = delimiter[0] as '*' | '_';
	const isEmphasis = delimiter === '*' || delimiter === '_';
	while (index < source.length) {
		if (source[index] === '\\') {
			index += 2;
			continue;
		}
		if (source.startsWith(delimiter, index)) {
			if (!isEmphasis || canCloseEmphasis(source, index, marker)) return index;
		}
		index += 1;
	}
	return -1;
}

function parseTag(source: string, start: number, tag: string) {
	const open = new RegExp(`^<${tag}\\b([^>]*)>`, 'i');
	const match = source.slice(start).match(open);
	if (!match) return null;
	const innerStart = start + match[0].length;
	const close = new RegExp(`</${tag}\\s*>`, 'ig');
	close.lastIndex = innerStart;
	const found = close.exec(source);
	if (!found) return null;
	return {
		attrs: match[1] ?? '',
		inner: source.slice(innerStart, found.index),
		end: found.index + found[0].length,
	};
}

function parseInlines(source: string): InlineNode[] {
	const nodes: InlineNode[] = [];
	let index = 0;
	let buffer = '';
	const flush = () => {
		if (!buffer) return;
		nodes.push({ type: 'text', value: buffer });
		buffer = '';
	};

	while (index < source.length) {
		const current = source[index]!;
		if (current === '\\' && index + 1 < source.length) {
			buffer += source[index + 1];
			index += 2;
			continue;
		}
		if (source.startsWith('<br', index) && /^<br\s*\/?>/i.test(source.slice(index))) {
			flush();
			nodes.push({ type: 'br' });
			index += source.slice(index).match(/^<br\s*\/?>/i)?.[0].length ?? 4;
			continue;
		}
		const span = parseTag(source, index, 'span');
		if (span) {
			const color = colorFromStyle(span.attrs.match(/style\s*=\s*(['"])(.*?)\1/i)?.[2]);
			flush();
			if (color) {
				nodes.push({ type: 'color', color, children: parseInlines(span.inner) });
			} else {
				nodes.push(...parseInlines(span.inner));
			}
			index = span.end;
			continue;
		}
		const underline = parseTag(source, index, 'u');
		if (underline) {
			flush();
			nodes.push({ type: 'u', children: parseInlines(underline.inner) });
			index = underline.end;
			continue;
		}
		const strong = parseTag(source, index, 'strong') ?? parseTag(source, index, 'b');
		if (strong) {
			flush();
			nodes.push({ type: 'strong', children: parseInlines(strong.inner) });
			index = strong.end;
			continue;
		}
		const emphasis = parseTag(source, index, 'em') ?? parseTag(source, index, 'i');
		if (emphasis) {
			flush();
			nodes.push({ type: 'em', children: parseInlines(emphasis.inner) });
			index = emphasis.end;
			continue;
		}
		if (source.startsWith('**', index) && canOpenEmphasis(source, index + 1, '*')) {
			const close = findClosing(source, index + 2, '**');
			if (close >= 0) {
				flush();
				nodes.push({ type: 'strong', children: parseInlines(source.slice(index + 2, close)) });
				index = close + 2;
				continue;
			}
		}
		if (source.startsWith('__', index) && canOpenEmphasis(source, index + 1, '_')) {
			const close = findClosing(source, index + 2, '__');
			if (close >= 0) {
				flush();
				nodes.push({ type: 'strong', children: parseInlines(source.slice(index + 2, close)) });
				index = close + 2;
				continue;
			}
		}
		if (current === '*' && canOpenEmphasis(source, index, '*')) {
			const close = findClosing(source, index + 1, '*');
			if (close >= 0) {
				flush();
				nodes.push({ type: 'em', children: parseInlines(source.slice(index + 1, close)) });
				index = close + 1;
				continue;
			}
		}
		if (current === '_' && canOpenEmphasis(source, index, '_')) {
			const close = findClosing(source, index + 1, '_');
			if (close >= 0) {
				flush();
				nodes.push({ type: 'em', children: parseInlines(source.slice(index + 1, close)) });
				index = close + 1;
				continue;
			}
		}
		buffer += current;
		index += 1;
	}
	flush();
	return nodes;
}

function inlineToHtml(nodes: InlineNode[]): string {
	return nodes
		.map((node) => {
			if (node.type === 'text') return escapeHtml(node.value);
			if (node.type === 'br') return '<br>';
			const inner = inlineToHtml(node.children);
			if (node.type === 'color') return `<span style="color: ${node.color}">${inner}</span>`;
			return `<${node.type}>${inner}</${node.type}>`;
		})
		.join('');
}

function isBullet(line: string) {
	return /^\s*[-*+]\s+/.test(line);
}

function isOrdered(line: string) {
	return /^\s*\d+\.\s+/.test(line);
}

function takeList(lines: string[], start: number, kind: 'ul' | 'ol') {
	const items: string[] = [];
	let index = start;
	const match = kind === 'ul' ? /^\s*[-*+]\s+/ : /^\s*\d+\.\s+/;
	while (index < lines.length && match.test(lines[index] ?? '')) {
		items.push(inlineToHtml(parseInlines((lines[index] ?? '').replace(match, ''))));
		index += 1;
	}
	return {
		html: `<${kind}>${items.map((item) => `<li>${item}</li>`).join('')}</${kind}>`,
		next: index,
	};
}

export function recallMarkdownToHtml(markdown: string) {
	const source = markdown.replace(/\r\n/g, '\n').trim();
	if (!source) return '';
	const lines = source.split('\n');
	const blocks: string[] = [];
	let index = 0;
	while (index < lines.length) {
		if (!(lines[index] ?? '').trim()) {
			index += 1;
			continue;
		}
		if (isBullet(lines[index] ?? '')) {
			const list = takeList(lines, index, 'ul');
			blocks.push(list.html);
			index = list.next;
			continue;
		}
		if (isOrdered(lines[index] ?? '')) {
			const list = takeList(lines, index, 'ol');
			blocks.push(list.html);
			index = list.next;
			continue;
		}
		const paragraph: string[] = [];
		while (
			index < lines.length &&
			(lines[index] ?? '').trim() &&
			!isBullet(lines[index] ?? '') &&
			!isOrdered(lines[index] ?? '')
		) {
			paragraph.push(lines[index] ?? '');
			index += 1;
		}
		blocks.push(
			`<p>${paragraph.map((line) => inlineToHtml(parseInlines(line))).join('<br>')}</p>`,
		);
	}
	return sanitizeRecallHtml(blocks.join(''));
}

function wrapLegacyPlain(value: string) {
	return value
		.split(/\n{2,}/)
		.map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
		.join('');
}

export function recallImportToStoredHtml(value: string) {
	const normalized = value.replace(/\r\n/g, '\n').trim();
	if (!normalized) return '';
	if (isRecallStoredHtml(normalized)) return sanitizeRecallHtml(normalized);
	return recallMarkdownToHtml(normalized);
}

export function recallToStoredHtml(value: string) {
	const normalized = value.replace(/\r\n/g, '\n').trim();
	if (!normalized) return '';
	if (isRecallStoredHtml(normalized)) return sanitizeRecallHtml(normalized);
	return wrapLegacyPlain(normalized);
}

function escapeMarkdownText(value: string) {
	return value.replace(/([\\*_])/g, '\\$1');
}

function markdownFromNodes(root: Element): string {
	const walk = (node: Node): string => {
		if (node.nodeType === 3) return escapeMarkdownText(node.textContent ?? '');
		if (!isElement(node)) return '';
		const tag = node.tagName.toLowerCase();
		const inner = Array.from(node.childNodes).map(walk).join('');
		if (tag === 'br') return '\n';
		// `***text***` is ambiguous to the deliberately small Markdown parser below:
		// the inner marker can be read as the closing delimiter of the outer mark.
		// Keep a single mark in familiar Markdown, but serialize nested marks as the
		// supported HTML form so export/import retains both marks without ambiguity.
		const hasNestedMark = Array.from(node.children).some((child) =>
			['strong', 'em', 'u', 'span'].includes(child.tagName.toLowerCase()),
		);
		if (tag === 'strong') return hasNestedMark ? `<strong>${inner}</strong>` : `**${inner}**`;
		if (tag === 'em') return hasNestedMark ? `<em>${inner}</em>` : `*${inner}*`;
		if (tag === 'u') return `<u>${inner}</u>`;
		if (tag === 'span') {
			const color = colorFromStyle(node.getAttribute('style'));
			return color ? `<span style="color: ${color}">${inner}</span>` : inner;
		}
		if (tag === 'li') return inner.trim();
		if (tag === 'ul') {
			return `${Array.from(node.children)
				.map((item) => `- ${walk(item)}`)
				.join('\n')}\n\n`;
		}
		if (tag === 'ol') {
			return `${Array.from(node.children)
				.map((item, index) => `${index + 1}. ${walk(item)}`)
				.join('\n')}\n\n`;
		}
		if (tag === 'p') return `${inner}\n\n`;
		return inner;
	};
	return Array.from(root.childNodes).map(walk).join('');
}

export function recallHtmlToMarkdown(html: string) {
	const sanitized = sanitizeRecallHtml(html);
	if (!sanitized) return '';
	const body = DOMPurify.sanitize(sanitized, {
		ALLOWED_TAGS,
		ALLOWED_ATTR: ['style'],
		ALLOW_DATA_ATTR: false,
		KEEP_CONTENT: true,
		RETURN_DOM: true,
	}) as unknown as HTMLElement;
	return decodeEntities(markdownFromNodes(body))
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}
