'use client';

import { useRouter } from 'next/navigation';

import { StudentIntakeWorkspace } from '@/components/teaching/admin/StudentIntakeWorkspace';
import { teachingApi } from '@/components/teaching/admin/api';
import { routes } from '@/config/routes';
import type { TeachingClassSetupResult } from '@/features/teaching/types';

export function ImportWorkspace() {
	const router = useRouter();

	return (
		<StudentIntakeWorkspace
			commitLabel="Tạo lớp từ danh sách"
			onExternalCommit={async (preview, resolutions) => {
				if (preview.existingClassId) {
					router.push(routes.admin.teachingClassTab(preview.existingClassId, 'students'));
					return;
				}
				if (!preview.metadata?.courseCode || !preview.metadata.groupNo) {
					throw new Error('File không có mã học phần/nhóm. Hãy tạo lớp mới rồi bổ sung danh sách.');
				}
				const result = await teachingApi<TeachingClassSetupResult>(
					'/api/admin/teaching/classes/setup',
					{
						method: 'POST',
						body: JSON.stringify({
							class: {
								courseCode: preview.metadata.courseCode,
								courseName: preview.metadata.courseName || preview.metadata.courseCode,
								groupNo: preview.metadata.groupNo,
								term: preview.metadata.term || 'Unknown term',
								credits: preview.metadata.credits,
								lecturerName: preview.metadata.lecturerName,
								lecturerCode: preview.metadata.lecturerCode,
							},
							rows: preview.rows.map((row) => ({
								key: row.key,
								input: row.input,
								expectedUpdatedAt: row.existing?.updatedAt ?? null,
								resolution: resolutions[row.key] ?? row.resolution,
							})),
						}),
					},
				);
				router.push(routes.admin.teachingClassTab(result.gradebook.class.id, 'attendance'));
			}}
		/>
	);
}
