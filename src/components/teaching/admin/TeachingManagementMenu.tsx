'use client';

import Link from 'next/link';
import { useState } from 'react';

import { McIcon } from '@/components/myclass/ui';
import { TeachingPopover } from '@/components/teaching/TeachingPopover';
import { Sheet } from '@/components/ui/Dialog';
import { routes } from '@/config/routes';

import { teachingSoftNavProps, useTeachingWorkspacePending } from './TeachingWorkspacePending';

type ManagementItem = { value: 'students' | 'setup' | 'share'; label: string; description: string };

const ITEMS: ManagementItem[] = [
	{ value: 'setup', label: 'Thiết lập', description: 'Thông tin lớp và buổi học' },
	{ value: 'share', label: 'Trang sinh viên', description: 'Nội dung, đường dẫn và quyền xem' },
];

export function TeachingManagementMenu({ classId, activeTab, publicPath }: { classId: string; activeTab?: string; publicPath?: string | null }) {
	const [mobileOpen, setMobileOpen] = useState(false);
	const pending = useTeachingWorkspacePending();
	const hrefFor = (value: ManagementItem['value']) => routes.mySpaceTeachingClassTab(classId, value);

	const items = (
		<>
			{ITEMS.map((item) => (
				<Link
					key={item.value}
					href={hrefFor(item.value)}
					className="teaching-management-item min-h-11"
					aria-current={activeTab === item.value ? 'page' : undefined}
					{...teachingSoftNavProps(hrefFor(item.value), pending?.navigate)}
				>
					<span>
						<span className="block text-sm font-semibold text-ink">{item.label}</span>
						<span className="mt-0.5 block text-xs text-ink-secondary">{item.description}</span>
					</span>
					{activeTab === item.value ? <span className="text-accent" aria-hidden>✓</span> : null}
				</Link>
			))}
			<a href={`/api/admin/teaching/classes/${classId}/export`} className="teaching-management-item min-h-11">
				<span>
					<span className="block text-sm font-semibold text-ink">Xuất Excel</span>
					<span className="mt-0.5 block text-xs text-ink-secondary">Tải roster và điểm về máy</span>
				</span>
				<span aria-hidden>↓</span>
			</a>
			{publicPath ? (
				<Link href={publicPath} target="_blank" className="teaching-management-item min-h-11">
					<span>
						<span className="block text-sm font-semibold text-ink">Mở trang công khai</span>
						<span className="mt-0.5 block text-xs text-ink-secondary">Xem như sinh viên</span>
					</span>
					<span aria-hidden>↗</span>
				</Link>
			) : null}
		</>
	);

	return (
		<>
			<div className="teaching-management-desktop hidden md:block">
				<TeachingPopover
					ariaLabel="Quản lý lớp"
					trigger={({ open, toggle, triggerRef, triggerProps }) => (
						<button
							ref={triggerRef}
							className="teaching-icon-button min-h-11"
							{...triggerProps}
							onClick={toggle}
						>
							<McIcon name="settings" size={16} />
							<span>Quản lý</span>
							<span className="sr-only">{open ? 'Đóng menu quản lý' : 'Mở menu quản lý'}</span>
						</button>
					)}
				>
					<div className="w-72">{items}</div>
				</TeachingPopover>
			</div>
			<div className="teaching-management-mobile md:hidden">
				<button
					type="button"
					className="teaching-icon-button teaching-management-mobile-trigger min-h-11 min-w-11"
					onClick={() => setMobileOpen(true)}
					aria-label="Mở menu quản lý"
					title="Quản lý"
				>
					<McIcon name="settings" size={17} />
					<span className="sr-only">Quản lý</span>
				</button>
			</div>
			<Sheet open={mobileOpen} onClose={() => setMobileOpen(false)} title="Quản lý lớp" side="bottom">
				<div className="grid gap-1">
					{ITEMS.map((item) => (
						<Link
							key={item.value}
							href={hrefFor(item.value)}
							onClick={(event) => {
								setMobileOpen(false);
								teachingSoftNavProps(hrefFor(item.value), pending?.navigate).onClick?.(event);
							}}
							className="teaching-management-item teaching-management-item-mobile min-h-11"
							aria-current={activeTab === item.value ? 'page' : undefined}
						>
							<span>
								<span className="block text-sm font-semibold text-ink">{item.label}</span>
								<span className="mt-0.5 block text-xs text-ink-secondary">{item.description}</span>
							</span>
							{activeTab === item.value ? <span className="text-accent" aria-hidden>✓</span> : null}
						</Link>
					))}
					<a href={`/api/admin/teaching/classes/${classId}/export`} className="teaching-management-item teaching-management-item-mobile min-h-11">
						<span>
							<span className="block text-sm font-semibold text-ink">Xuất Excel</span>
							<span className="mt-0.5 block text-xs text-ink-secondary">Tải dữ liệu lớp</span>
						</span>
						<span aria-hidden>↓</span>
					</a>
					{publicPath ? (
						<Link href={publicPath} target="_blank" className="teaching-management-item teaching-management-item-mobile min-h-11">
							<span>
								<span className="block text-sm font-semibold text-ink">Mở trang công khai</span>
								<span className="mt-0.5 block text-xs text-ink-secondary">Xem như sinh viên</span>
							</span>
							<span aria-hidden>↗</span>
						</Link>
					) : null}
				</div>
			</Sheet>
		</>
	);
}
