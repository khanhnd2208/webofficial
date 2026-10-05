import { RuleTester } from 'eslint';
import plugin from './design-lint.mjs';

new RuleTester().run('design-values', plugin.rules['design-values'], {
	valid: [
		"const classes = 'text-xs text-ink bg-paper';",
		"const classes = 'text-[17px]';",
		"const styles = { fontSize: 12, color: 'var(--ink)' };",
	],
	invalid: [
		{ code: "const classes = 'md:text-[10px]';", errors: [{ messageId: 'tinyText' }] },
		{ code: "const classes = 'text-[0.6875rem]';", errors: [{ messageId: 'tinyText' }] },
		{ code: 'const classes = `text-[#171717]`;', errors: [{ messageId: 'rawColor' }] },
		{ code: 'const styles = { fontSize: 11 };', errors: [{ messageId: 'tinyText' }] },
	],
});
