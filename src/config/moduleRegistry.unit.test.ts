import { describe, expect, it } from 'vitest';

import {
	getActiveModules,
	getArchivedModules,
	getArchivedModulesByGroup,
	getArchivedPublicPrefixes,
	isArchivedAdminPath,
	isArchivedPublicPath,
	isMainAdminPath,
	resolveModuleByAdminPath,
	resolveModuleByPublicPath,
} from './moduleRegistry';
import { routes } from './routes';

describe('operating module registry', () => {
	it('keeps Teaching active while its menu entry leads out of Admin', () => {
		expect(getActiveModules().map((module) => module.id)).toEqual([
			'inquiries',
			'website',
			'teaching',
			'learning-analytics',
		]);
		expect(resolveModuleByAdminPath(routes.admin.inquiries)?.id).toBe('inquiries');
		expect(resolveModuleByAdminPath(`${routes.admin.inquiries}/abc`)?.id).toBe('inquiries');
		expect(resolveModuleByAdminPath(routes.admin.teaching)?.nav).toMatchObject({
			href: routes.mySpaceTeaching,
			leavesAdmin: true,
		});
	});

	it('classifies paused product areas as archived without dropping them', () => {
		const ids = getArchivedModules().map((module) => module.id);
		expect(ids).toEqual(
			expect.arrayContaining([
				'posts',
				'my-class',
				'myspace-tests',
				'vocabulary',
				'lucky-card',
				'messages',
				'users',
				'media',
				'settings',
				'tools-hub',
			]),
		);
		expect(ids).not.toContain('website');
		expect(ids).not.toContain('teaching');
	});

	it('groups archived modules for the archive hub', () => {
		const groups = getArchivedModulesByGroup().map((entry) => entry.group);
		expect(groups).toEqual(
			expect.arrayContaining([
				'Bài viết / Ghi chép',
				'My Class',
				'My Space Tests',
				'Vocabulary',
				'Lucky Card',
				'Messages',
				'Users',
				'Media',
				'Settings',
			]),
		);
	});

	it('folds Active Recall admin paths into Teaching without treating the tools hub as the owner', () => {
		expect(resolveModuleByAdminPath(routes.admin.activeRecall)?.id).toBe('teaching');
		expect(resolveModuleByAdminPath(`${routes.admin.activeRecall}/new`)?.status).toBe('active');
		expect(resolveModuleByAdminPath(routes.admin.tools)?.id).toBe('tools-hub');
		expect(resolveModuleByAdminPath(routes.admin.vocabulary)?.id).toBe('vocabulary');
	});

	it('keeps main admin chrome for Website and Teaching compatibility paths', () => {
		expect(isMainAdminPath(routes.admin.home)).toBe(true);
		expect(isMainAdminPath(routes.admin.website)).toBe(true);
		expect(isMainAdminPath(routes.admin.learnAnalytics)).toBe(true);
		expect(isMainAdminPath(`${routes.admin.inquiries}/abc`)).toBe(true);
		expect(isMainAdminPath(routes.admin.activeRecall)).toBe(true);
		expect(isArchivedAdminPath(routes.admin.home)).toBe(false);
		expect(isArchivedAdminPath(routes.admin.activeRecall)).toBe(false);
	});

	it('routes leftover admin modules through the archive shell', () => {
		expect(isArchivedAdminPath(routes.admin.archive)).toBe(true);
		expect(isArchivedAdminPath(routes.admin.posts)).toBe(true);
		expect(isArchivedAdminPath(routes.admin.myClass)).toBe(true);
		expect(isArchivedAdminPath(`${routes.admin.myClass}/courses`)).toBe(true);
		expect(isArchivedAdminPath(routes.admin.users)).toBe(true);
		expect(isArchivedAdminPath(routes.admin.tools)).toBe(true);
		expect(isArchivedAdminPath(routes.admin.vocabulary)).toBe(true);
		expect(isArchivedAdminPath('/admin/unknown-legacy')).toBe(true);
	});

	it('marks archived public surfaces and leaves brand and Teaching open', () => {
		expect(isArchivedPublicPath(routes.notes)).toBe(true);
		expect(isArchivedPublicPath(`${routes.notes}/a-note`)).toBe(true);
		expect(isArchivedPublicPath(routes.myClass)).toBe(true);
		expect(isArchivedPublicPath(routes.mySpaceTests)).toBe(true);
		expect(isArchivedPublicPath('/vocabulary/store')).toBe(true);
		expect(isArchivedPublicPath(routes.about)).toBe(false);
		expect(isArchivedPublicPath(routes.activeRecall)).toBe(false);
		expect(isArchivedPublicPath('/lop/hrm-101')).toBe(false);
		expect(isArchivedPublicPath(routes.contact)).toBe(false);
		expect(getArchivedPublicPrefixes()).toEqual(
			expect.arrayContaining([routes.notes, routes.myClass, routes.mySpaceTests, '/vocabulary']),
		);
		expect(resolveModuleByPublicPath(routes.activeRecall)?.id).toBe('teaching');
		expect(resolveModuleByPublicPath('/lop/hrm-101')?.id).toBe('teaching');
	});
});
