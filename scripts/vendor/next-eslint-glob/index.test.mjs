import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { after, test } from 'node:test';
import { Linter } from 'eslint';

const require = createRequire(import.meta.url);
const pluginRequire = createRequire(resolve('node_modules/@next/eslint-plugin-next/package.json'));
const { globSync } = pluginRequire('fast-glob');
const plugin = require('@next/eslint-plugin-next');
const { getRootDirs } = require(
	join(dirname(require.resolve('@next/eslint-plugin-next')), 'utils/get-root-dirs.js'),
);

const root = mkdtempSync(join(tmpdir(), 'next-eslint-glob-'));
const web = join(root, 'apps/web');
const docs = join(root, 'apps/docs');
mkdirSync(join(web, 'pages'), { recursive: true });
mkdirSync(join(docs, 'pages'), { recursive: true });
writeFileSync(join(web, 'pages/about.js'), '');
after(() => rmSync(root, { recursive: true, force: true }));

test('the installed Next ESLint plugin resolves the repository adapter', () => {
	const metadata = pluginRequire('fast-glob/package.json');
	assert.equal(metadata.name, '@webofficial/next-eslint-glob');
	assert.equal(metadata.dependencies.tinyglobby, '0.2.17');
});

test('literal project roots do not expand into descendant directories', () => {
	assert.deepEqual(globSync(web, { onlyDirectories: true }), [web]);
	assert.deepEqual(globSync('apps/web', { cwd: root, onlyDirectories: true }), ['apps/web']);
});

test('wildcard, brace and array patterns return only the matching directories', () => {
	assert.deepEqual(globSync('apps/*', { cwd: root, onlyDirectories: true }).sort(), [
		'apps/docs',
		'apps/web',
	]);
	assert.deepEqual(globSync('apps/{web,docs}', { cwd: root, onlyDirectories: true }).sort(), [
		'apps/docs',
		'apps/web',
	]);
	assert.deepEqual(
		globSync(['apps/web', 'apps/docs'], { cwd: root, onlyDirectories: true }).sort(),
		['apps/docs', 'apps/web'],
	);
});

test('the actual Next root-directory helper preserves default, literal and glob settings', () => {
	assert.deepEqual(getRootDirs({ cwd: root, settings: {} }), [root]);
	assert.deepEqual(getRootDirs({ cwd: root, settings: { next: { rootDir: web } } }), [web]);
	assert.deepEqual(
		getRootDirs({ cwd: root, settings: { next: { rootDir: join(root, 'apps/*') } } }).sort(),
		[docs, web].sort(),
	);
	assert.deepEqual(
		getRootDirs({ cwd: root, settings: { next: { rootDir: [web, docs] } } }).sort(),
		[docs, web].sort(),
	);
});

test('Next still rejects internal HTML anchors with a configured project root', () => {
	const linter = new Linter({ cwd: root });
	const config = {
		files: ['**/*.jsx'],
		languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
		plugins: { '@next/next': plugin },
		settings: { next: { rootDir: web } },
		rules: { '@next/next/no-html-link-for-pages': 'error' },
	};
	const options = { filename: join(web, 'component.jsx') };
	const messages = linter.verify('const node = <a href="/about">About</a>;', [config], options);
	assert.equal(messages.length, 1);
	assert.equal(messages[0].ruleId, '@next/next/no-html-link-for-pages');
	assert.deepEqual(
		linter.verify('const node = <Link href="/about">About</Link>;', [config], options),
		[],
	);
});

test('deeply nested braces cannot exhaust the Node call stack', () => {
	const pattern = '{'.repeat(4_000) + 'missing' + '}'.repeat(4_000);
	assert.deepEqual(globSync(pattern, { cwd: root, onlyDirectories: true }), []);
});

test('the VPS dependency cache changes when local adapter source changes', () => {
	const source = readFileSync(resolve('scripts/deploy-vps.sh'), 'utf8');
	const stampFunction = source.match(/^dependency_stamp\(\) \{\n[\s\S]*?^\}/m)?.[0];
	assert.ok(stampFunction);
	writeFileSync(join(root, 'package.json'), '{"private":true}');
	writeFileSync(join(root, 'package-lock.json'), '{}');
	const vendor = join(root, 'scripts/vendor/next-eslint-glob');
	mkdirSync(vendor, { recursive: true });
	const adapter = join(vendor, 'index.cjs');
	writeFileSync(adapter, 'version one');
	// macOS names this utility shasum; the VPS uses GNU sha256sum.
	const fallback =
		'if ! command -v sha256sum >/dev/null; then sha256sum() { shasum -a 256 "$@"; }; fi';
	const stamp = () =>
		execFileSync('bash', ['-c', `${fallback}\n${stampFunction}\ndependency_stamp`], {
			cwd: root,
			encoding: 'utf8',
		}).trim();
	const initial = stamp();
	assert.equal(stamp(), initial);
	writeFileSync(adapter, 'version two');
	assert.notEqual(stamp(), initial);
});
