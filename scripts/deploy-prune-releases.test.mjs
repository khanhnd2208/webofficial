import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	utimesSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./deploy-prune-releases.sh', import.meta.url));

let sandbox;
let root;
let npmCache;
let binDir;

beforeEach(() => {
	sandbox = mkdtempSync(join(tmpdir(), 'prune-releases-'));
	root = join(sandbox, 'webofficial');
	npmCache = join(sandbox, 'npm-cache');
	binDir = join(sandbox, 'bin');
	mkdirSync(join(root, 'releases'), { recursive: true });
	mkdirSync(binDir);
	// A stand-in npm so the test never reads or clears the real npm cache.
	writeFileSync(
		join(binDir, 'npm'),
		`#!/usr/bin/env bash
case "$*" in
	"config get cache") echo "${npmCache}" ;;
	"cache clean --force") rm -rf -- "${npmCache}/_cacache" ;;
	*) exit 1 ;;
esac
`,
		{ mode: 0o755 },
	);
});

afterEach(() => {
	rmSync(sandbox, { recursive: true, force: true });
});

// Ages are minutes in the past; a larger age is an older release.
function release(id, ageMinutes) {
	const dir = join(root, 'releases', id);
	mkdirSync(join(dir, '.next', 'cache'), { recursive: true });
	writeFileSync(join(dir, '.next', 'BUILD_ID'), id);
	const time = new Date(Date.now() - ageMinutes * 60_000);
	utimesSync(dir, time, time);
	return dir;
}

function setCurrent(id) {
	symlinkSync(`releases/${id}`, join(root, 'current'));
}

function prune(args, env = {}) {
	return spawnSync('bash', [script, ...args], {
		encoding: 'utf8',
		env: { ...process.env, PATH: `${binDir}:${process.env.PATH}`, ...env },
	});
}

const present = (id) => existsSync(join(root, 'releases', id));
const hasCache = (id) => existsSync(join(root, 'releases', id, '.next', 'cache'));

test('keeps current plus the newest releases and deletes the rest', () => {
	for (let age = 1; age <= 8; age += 1) release(`r${age}`, age * 10);
	setCurrent('r6');

	const result = prune([root, '3', '0']);

	assert.equal(result.status, 0, result.stderr);
	assert.deepEqual(['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'].filter(present), [
		'r1',
		'r2',
		'r3',
		'r6',
	]);
});

test('drops the build cache from every kept release except current and protected ones', () => {
	release('new', 1);
	release('live', 10);
	release('old', 20);
	setCurrent('live');

	const result = prune([root, '5', '0', 'new']);

	assert.equal(result.status, 0, result.stderr);
	assert.equal(hasCache('live'), true);
	assert.equal(hasCache('new'), true);
	assert.equal(hasCache('old'), false);
	assert.equal(existsSync(join(root, 'releases', 'old', '.next', 'BUILD_ID')), true);
});

test('never deletes a protected release, however old', () => {
	release('a', 1);
	release('b', 2);
	release('ancient', 500);
	setCurrent('a');

	const result = prune([root, '1', '0', 'ancient']);

	assert.equal(result.status, 0, result.stderr);
	assert.equal(present('ancient'), true);
	assert.equal(present('b'), true);
});

test('dry run reports and deletes nothing', () => {
	for (let age = 1; age <= 4; age += 1) release(`r${age}`, age);
	setCurrent('r1');

	const result = prune(['--dry-run', root, '1', '0']);

	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /would remove .*r4/);
	assert.equal(['r1', 'r2', 'r3', 'r4'].every(present), true);
	assert.equal(hasCache('r2'), true);
});

test('ignores symlinks inside releases and leaves their targets alone', () => {
	const outside = join(sandbox, 'outside');
	mkdirSync(outside);
	release('r1', 1);
	release('r2', 2);
	setCurrent('r1');
	symlinkSync(outside, join(root, 'releases', 'link'));

	const result = prune([root, '1', '0']);

	assert.equal(result.status, 0, result.stderr);
	assert.equal(existsSync(outside), true);
	assert.equal(existsSync(join(root, 'releases', 'link')), true);
});

test('refuses to run when current points at a missing release', () => {
	release('r1', 1);
	setCurrent('gone');

	const result = prune([root, '1', '0']);

	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /missing release/);
	assert.equal(present('r1'), true);
});

test('rejects unsafe arguments before touching anything', () => {
	release('r1', 1);
	assert.notEqual(prune(['/', '3', '0']).status, 0);
	assert.notEqual(prune([root, '0', '0']).status, 0);
	assert.notEqual(prune([root, '3', 'x']).status, 0);
	assert.notEqual(prune([root, '3', '0', '../escape']).status, 0);
	assert.equal(present('r1'), true);
});

test('clears the npm cache only once it passes the limit', () => {
	mkdirSync(join(npmCache, '_cacache'), { recursive: true });
	writeFileSync(join(npmCache, '_cacache', 'blob'), 'x'.repeat(8192));

	assert.equal(prune([root, '3', '0']).status, 0);
	assert.equal(existsSync(join(npmCache, '_cacache')), true);

	const result = prune([root, '3', '0'], { NPM_CACHE_MAX_GB: '0' });
	assert.equal(result.status, 0, result.stderr);
	assert.equal(existsSync(join(npmCache, '_cacache')), false);
});

test('fails when the disk is still short of the required free space', () => {
	const result = prune([root, '3', '999999']);

	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /a deploy needs at least 999999 GB/);
});

test('works on the first release-based deploy, before current exists', () => {
	release('r1', 1);
	release('r2', 2);

	const result = prune([root, '1', '0']);

	assert.equal(result.status, 0, result.stderr);
	assert.equal(present('r1'), true);
	assert.equal(present('r2'), false);
});

test('candidate compilation cannot inherit stale CSS from a previous release', () => {
	const current = release('old', 10);
	const candidate = release('candidate', 0);
	setCurrent('old');
	const staleCss = join(current, '.next/cache/old.css');
	writeFileSync(staleCss, '.old-header { height: 1000px }');
	writeFileSync(join(candidate, '.next/cache/old.css'), 'stale candidate cache');
	const source = readFileSync(new URL('./deploy-vps.sh', import.meta.url), 'utf8');
	const build = source.match(
		/^echo "Building candidate before any database migration"[\s\S]*?^test -s \.next\/BUILD_ID/m,
	)?.[0];
	assert.ok(build);
	const result = spawnSync(
		'bash',
		[
			'-c',
			`set -euo pipefail
npm() {
	[[ "$*" == "run build" ]]
	[[ ! -e .next/cache/old.css ]]
	[[ "$NEXT_DEPLOYMENT_ID" == candidate ]]
	printf 'new-build' > .next/BUILD_ID
}
${build}`,
		],
		{
			cwd: candidate,
			encoding: 'utf8',
			env: {
				...process.env,
				RELEASE_DIR: candidate,
				RELEASE_ID: 'candidate',
				CURRENT_LINK: join(root, 'current'),
				DEPLOY_ROOT: root,
				PREVIOUS_TARGET: 'releases/old',
			},
		},
	);
	assert.equal(result.status, 0, result.stderr);
	assert.equal(readFileSync(staleCss, 'utf8'), '.old-header { height: 1000px }');
	assert.equal(readFileSync(join(candidate, '.next/BUILD_ID'), 'utf8'), 'new-build');
});
