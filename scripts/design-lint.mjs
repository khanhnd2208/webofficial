/** Local design guards. Vector and chart pigments live in src/config/graphicColors.ts. */
const designValues = {
	meta: {
		type: 'problem',
		schema: [],
		messages: {
			tinyText: 'Text must be at least 12px. Use text-xs or a larger typography token.',
			rawColor: 'Use a semantic color token, or the shared pigment palette for graphics.',
		},
	},
	create(context) {
		function inspect(node, value) {
			if (typeof value !== 'string') return;
			for (const match of value.matchAll(/text-\[([\d.]+)(px|rem)\]/g)) {
				if (Number(match[1]) * (match[2] === 'rem' ? 16 : 1) < 12) {
					context.report({ node, messageId: 'tinyText' });
					break;
				}
			}
			if (/#[\da-fA-F]{3,8}\b/.test(value)) context.report({ node, messageId: 'rawColor' });
		}
		return {
			Literal(node) {
				inspect(node, node.value);
			},
			TemplateElement(node) {
				inspect(node, node.value.cooked);
			},
			Property(node) {
				const name = node.key.name ?? node.key.value;
				if (name === 'fontSize' && typeof node.value.value === 'number' && node.value.value < 12) {
					context.report({ node, messageId: 'tinyText' });
				}
			},
		};
	},
};

const plugin = { rules: { 'design-values': designValues } };
export default plugin;
