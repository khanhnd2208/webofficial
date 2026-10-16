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
		/^\techo "Building candidate before any database migration"[\s\S]*?^\tprintf '%s\\n' "\$RELEASE_ID" > \.next\/DEPLOYMENT_ID$/m,
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
	assert.equal(readFileSync(join(candidate, '.next/DEPLOYMENT_ID'), 'utf8'), 'candidate\n');
});

test('the build skips its TypeScript pass only when CI typechecked the commit', () => {
	release('candidate', 0);
	const source = readFileSync(new URL('./deploy-vps.sh', import.meta.url), 'utf8');
	const build = source.match(
		/^\techo "Building candidate before any database migration"[\s\S]*?^\tprintf '%s\\n' "\$RELEASE_ID" > \.next\/DEPLOYMENT_ID$/m,
	)?.[0];
	assert.ok(build);
	for (const [skip, expected] of [
		[undefined, ''],
		['false', ''],
		['true', '1'],
	]) {
		const env = {
			...process.env,
			RELEASE_DIR: join(root, 'releases/candidate'),
			RELEASE_ID: 'candidate',
			SOURCE_SHA: 'abc123',
			EXPECTED_SKIP: expected,
		};
		delete env.NEXT_SKIP_BUILD_TYPECHECK;
		delete env.SKIP_BUILD_TYPECHECK;
		if (skip !== undefined) env.SKIP_BUILD_TYPECHECK = skip;
		const result = spawnSync(
			'bash',
			[
				'-c',
				`set -euo pipefail
npm() {
	[[ "\${NEXT_SKIP_BUILD_TYPECHECK:-}" == "$EXPECTED_SKIP" ]]
	printf 'new-build' > .next/BUILD_ID
}
${build}`,
			],
			{ cwd: join(root, 'releases/candidate'), encoding: 'utf8', env },
		);
		assert.equal(result.status, 0, `${skip}: ${result.stderr}`);
	}
});

const deploySource = () => readFileSync(new URL('./deploy-vps.sh', import.meta.url), 'utf8');
const repoRoot = fileURLToPath(new URL('..', import.meta.url));

test('a release starts with the deployment ID its build recorded', () => {
	const fn = deploySource().match(/^release_deployment_id\(\) \{[\s\S]*?^\}$/m)?.[0];
	assert.ok(fn);
	const recorded = release('ci-built', 0);
	writeFileSync(join(recorded, '.next/DEPLOYMENT_ID'), 'ci-abc123-42-1\n');
	const legacy = release('20260101T000000Z-abc', 0);
	const unsafe = release('unsafe', 0);
	writeFileSync(join(unsafe, '.next/DEPLOYMENT_ID'), '../../etc\n');
	const result = spawnSync(
		'bash',
		[
			'-c',
			`set -euo pipefail\n${fn}\nfor dir in "$@"; do release_deployment_id "$dir"; done`,
			'-',
			recorded,
			legacy,
			unsafe,
		],
		{ encoding: 'utf8' },
	);
	assert.equal(result.status, 0, result.stderr);
	assert.deepEqual(result.stdout.trim().split('\n'), [
		'ci-abc123-42-1',
		'20260101T000000Z-abc',
		'unsafe',
	]);
});

test('a prebuilt release is used only when its baked-in public values match production', () => {
	const fn = deploySource().match(
		/^prebuilt_env_matches\(\) \{[\s\S]*?^NODE_BUILD_ENV_CHECK\n\}$/m,
	)?.[0];
	assert.ok(fn);
	const dir = release('candidate', 0);
	const locks = 'PUBLIC_TESTS_ENABLED=false\nPUBLIC_KNOWLEDGE_ENABLED=false\n';
	const check = (production, built) => {
		writeFileSync(join(dir, '.env.local'), production);
		writeFileSync(join(dir, '.next/BUILD_ENV'), built);
		return spawnSync('bash', ['-c', `set -euo pipefail\n${fn}\nprebuilt_env_matches`], {
			cwd: repoRoot,
			encoding: 'utf8',
			env: { ...process.env, RELEASE_DIR: dir },
		});
	};
	const id = 'NEXT_PUBLIC_UMAMI_WEBSITE_ID';
	assert.equal(check(`SECRET=x\n${id}="abc"\n${locks}`, `${id}=abc\n${locks}`).status, 0);
	const missing = check(`${id}=abc\n${locks}`, locks);
	assert.equal(missing.status, 1);
	assert.match(missing.stderr, /NEXT_PUBLIC_UMAMI_WEBSITE_ID/);
	assert.doesNotMatch(missing.stderr, /abc/);
	assert.equal(check(`${id}=abc\nPUBLIC_TESTS_ENABLED=true\n`, `${id}=abc\n${locks}`).status, 1);
});

test('the deploy backs up databases unless Prisma reports nothing to migrate', () => {
	const block = deploySource().match(/^if migration_status=[\s\S]*?^fi$/m)?.[0];
	assert.ok(block);
	const dir = release('candidate', 0);
	mkdirSync(join(dir, 'node_modules/.bin'), { recursive: true });
	for (const [status, exitCode, backedUp] of [
		['Database schema is up to date!', 0, false],
		['Following migration have not yet been applied:', 1, true],
		['Error: P1001: Can not reach database server', 1, true],
	]) {
		writeFileSync(
			join(dir, 'node_modules/.bin/prisma'),
			`#!/usr/bin/env bash\necho "${status}"\nexit ${exitCode}\n`,
			{
				mode: 0o755,
			},
		);
		writeFileSync(join(dir, '.deploy-metadata'), '');
		const result = spawnSync(
			'bash',
			[
				'-c',
				`set -Eeuo pipefail\nsudo() { [[ "$*" == "-n /opt/backup" ]]; echo BACKUP_RAN; }\n${block}\necho "completed=$BACKUP_COMPLETED"`,
			],
			{
				cwd: dir,
				encoding: 'utf8',
				env: {
					...process.env,
					RELEASE_DIR: dir,
					BACKUP_COMMAND: '/opt/backup',
					BACKUP_COMPLETED: 'no',
				},
			},
		);
		assert.equal(result.status, 0, result.stderr);
		assert.equal(result.stdout.includes('BACKUP_RAN'), backedUp, status);
		assert.match(result.stdout, backedUp ? /completed=yes/ : /completed=no/);
	}
});
