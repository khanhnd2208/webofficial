'use client';

import Link from 'next/link';
import { useState } from 'react';

import { McIcon } from '@/components/myclass/ui';
import { Sheet } from '@/components/ui/Dialog';
import { routes } from '@/config/routes';

import { teachingSoftNavProps, useTeachingWorkspacePending } from './TeachingWorkspacePending';

type ManagementItem = { value: 'students' | 'setup' | 'share'; label: string; description: string };

const ITEMS: ManagementItem[] = [
	{ value: 'students', label: 'Học viên', description: 'Danh sách, thêm và chỉnh sửa học viên' },
	{ value: 'setup', label: 'Thiết lập', description: 'Thông tin lớp và buổi học' },
	{ value: 'share', label: 'Chia sẻ', description: 'Đường dẫn và quyền xem của sinh viên' },
];

export function TeachingManagementMenu({ classId, activeTab, publicPath }: { classId: string; activeTab?: string; publicPath?: string | null }) {
	const [mobileOpen, setMobileOpen] = useState(false);
	const pending = useTeachingWorkspacePending();
	const hrefFor = (value: ManagementItem['value']) => routes.mySpaceTeachingClassTab(classId, value);

	return (
		<>
			<div className="teaching-management-desktop hidden md:block">
				<details className="teaching-management-menu relative">
					<summary className="teaching-icon-button list-none">
						<McIcon name="settings" size={16} />
						<span>Quản lý</span>
					</summary>
					<div className="teaching-management-popover absolute right-0 z-40 mt-2 w-72 rounded-[var(--mc-r-md)] border border-mc-rule bg-paper p-2 shadow-lg">
						{ITEMS.map((item) => (
							<Link key={item.value} href={hrefFor(item.value)} className="teaching-management-item" aria-current={activeTab === item.value ? 'page' : undefined} {...teachingSoftNavProps(hrefFor(item.value), pending?.navigate)}>
								<span><span className="block text-sm font-semibold text-ink">{item.label}</span><span className="mt-0.5 block text-xs text-ink-secondary">{item.description}</span></span>
								{activeTab === item.value ? <span className="text-accent" aria-hidden>✓</span> : null}
							</Link>
						))}
						<a href={`/api/admin/teaching/classes/${classId}/export`} className="teaching-management-item"><span><span className="block text-sm font-semibold text-ink">Xuất Excel</span><span className="mt-0.5 block text-xs text-ink-secondary">Tải roster và điểm về máy</span></span><span aria-hidden>↓</span></a>
						{publicPath ? <Link href={publicPath} target="_blank" className="teaching-management-item"><span><span className="block text-sm font-semibold text-ink">Mở trang công khai</span><span className="mt-0.5 block text-xs text-ink-secondary">Xem như sinh viên</span></span><span aria-hidden>↗</span></Link> : null}
					</div>
				</details>
			</div>
			<div className="teaching-management-mobile md:hidden">
				<button type="button" className="teaching-icon-button teaching-management-mobile-trigger" onClick={() => setMobileOpen(true)} aria-label="Mở menu quản lý" title="Quản lý"><McIcon name="settings" size={17} /><span className="sr-only">Quản lý</span></button>
			</div>
			<Sheet open={mobileOpen} onClose={() => setMobileOpen(false)} title="Quản lý lớp" side="bottom">
				<div className="grid gap-1">
					{ITEMS.map((item) => (
						<Link key={item.value} href={hrefFor(item.value)} onClick={(event) => { setMobileOpen(false); teachingSoftNavProps(hrefFor(item.value), pending?.navigate).onClick?.(event); }} className="teaching-management-item teaching-management-item-mobile" aria-current={activeTab === item.value ? 'page' : undefined}>
							<span><span className="block text-sm font-semibold text-ink">{item.label}</span><span className="mt-0.5 block text-xs text-ink-secondary">{item.description}</span></span>
							{activeTab === item.value ? <span className="text-accent" aria-hidden>✓</span> : null}
						</Link>
					))}
					<a href={`/api/admin/teaching/classes/${classId}/export`} className="teaching-management-item teaching-management-item-mobile"><span><span className="block text-sm font-semibold text-ink">Xuất Excel</span><span className="mt-0.5 block text-xs text-ink-secondary">Tải dữ liệu lớp</span></span><span aria-hidden>↓</span></a>
					{publicPath ? <Link href={publicPath} target="_blank" className="teaching-management-item teaching-management-item-mobile"><span><span className="block text-sm font-semibold text-ink">Mở trang công khai</span><span className="mt-0.5 block text-xs text-ink-secondary">Xem như sinh viên</span></span><span aria-hidden>↗</span></Link> : null}
				</div>
			</Sheet>
		</>
	);
}
