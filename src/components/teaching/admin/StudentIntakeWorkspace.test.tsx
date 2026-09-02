import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { teachingApi } from '@/components/teaching/admin/api';
import type { RosterImportPreview } from '@/features/teaching/domain/rosterImport';
import { rosterPasteSample } from '@/features/teaching/imports/rosterCsvTemplate';

import { StudentIntakeWorkspace } from './StudentIntakeWorkspace';

vi.mock('@/components/teaching/admin/api', () => ({
	teachingApi: vi.fn(),
	AdminApiError: class AdminApiError extends Error {
		code?: string;
		constructor(message: string, init?: { code?: string }) {
			super(message);
			this.code = init?.code;
		}
	},
}));

const apiMock = vi.mocked(teachingApi);

function previewRow(
	overrides: Omit<Partial<RosterImportPreview['rows'][number]>, 'input'> & {
		input?: Partial<RosterImportPreview['rows'][number]['input']>;
	} = {},
): RosterImportPreview['rows'][number] {
	return {
		key: '2:SV01',
		status: 'new',
		accessMode: 'OPEN',
		conflicts: [],
		fillBlankFields: [],
		resolution: {},
		existing: null,
		...overrides,
		input: {
			sourceRow: 2,
			orderNo: 1,
			studentCode: 'SV01',
			familyName: 'Nguyễn',
			givenName: 'An',
			homeClassCode: 'K66A',
			majorName: 'Quản trị nhân lực',
			dateOfBirth: null,
			phone: null,
			email: null,
			tutorialCode: null,
			tutorialClassId: null,
			enrolledFromWeek: 1,
			fieldErrors: {},
			...overrides.input,
		} as RosterImportPreview['rows'][number]['input'],
	};
}

function preview(overrides: Partial<RosterImportPreview> = {}): RosterImportPreview {
	const rows = overrides.rows ?? [previewRow()];
	return {
		metadata: null,
		existingClassId: null,
		summary: {
			total: rows.length,
			newCount: rows.filter((row) => row.status === 'new').length,
			exactCount: rows.filter((row) => row.status === 'exact').length,
			fillBlankCount: rows.filter((row) => row.status === 'fill_blank').length,
			conflictCount: rows.filter((row) => row.status === 'conflict').length,
			invalidCount: rows.filter((row) => row.status === 'invalid').length,
			openAccessCount: rows.filter((row) => row.accessMode === 'OPEN').length,
		},
		rows,
		...overrides,
	};
}

describe('StudentIntakeWorkspace', () => {
	beforeEach(() => {
		apiMock.mockReset();
	});

	it('previews pasted sample data through the shared preview endpoint', async () => {
		apiMock.mockResolvedValueOnce(preview());
		render(<StudentIntakeWorkspace classId="class-1" />);
		fireEvent.click(screen.getByRole('tab', { name: 'Dán dữ liệu' }));
		fireEvent.click(screen.getByRole('button', { name: 'Dán dữ liệu mẫu' }));
		expect(screen.getByRole('textbox')).toHaveValue(rosterPasteSample());
		fireEvent.click(screen.getByRole('button', { name: 'Xem trước dữ liệu dán' }));

		await screen.findByText('SV01');
		expect(screen.getByText('Chưa có ngày sinh — vào trực tiếp')).toBeInTheDocument();
		expect(apiMock).toHaveBeenCalledWith(
			'/api/admin/teaching/classes/class-1/roster-import?mode=preview',
			expect.objectContaining({ method: 'POST' }),
		);
		const body = JSON.parse(String(apiMock.mock.calls[0]?.[1]?.body)) as { source: string; text: string };
		expect(body.source).toBe('paste');
		expect(body.text).toContain('Mã SV');
	});

	it('does not allow commit while a row is invalid', async () => {
		apiMock.mockResolvedValueOnce(
			preview({
				rows: [
					previewRow({
						status: 'invalid',
						input: {
							studentCode: '',
							familyName: 'Nguyễn',
							givenName: 'An',
							fieldErrors: { studentCode: 'Mã sinh viên là bắt buộc' },
						},
					}),
				],
			}),
		);
		render(<StudentIntakeWorkspace classId="class-1" />);
		fireEvent.click(screen.getByRole('tab', { name: 'Dán dữ liệu' }));
		fireEvent.change(screen.getByRole('textbox'), { target: { value: 'bad' } });
		fireEvent.click(screen.getByRole('button', { name: 'Xem trước dữ liệu dán' }));
		await screen.findByText('Mã sinh viên là bắt buộc');
		expect(screen.getByRole('button', { name: 'Lưu danh sách' })).toBeDisabled();
	});

	it('requires a keep/use-new choice before committing a conflict', async () => {
		apiMock.mockResolvedValueOnce(
			preview({
				rows: [
					previewRow({
						key: '2:SV01',
						status: 'conflict',
						accessMode: 'DOB_PASSWORD',
						conflicts: [{ field: 'familyName', current: 'Nguyễn', incoming: 'Trần' }],
						resolution: {},
						existing: {
							studentId: 'st1',
							updatedAt: '2026-09-01T00:00:00.000Z',
							studentCode: 'SV01',
							familyName: 'Nguyễn',
							givenName: 'An',
							dateOfBirth: '2006-05-29',
							homeClassCode: 'K66A',
							majorName: 'Quản trị nhân lực',
							phone: '0901234567',
							email: 'sv01@example.edu',
							enrollmentId: 'en1',
							enrollmentStatus: 'ACTIVE',
						},
						input: {
							familyName: 'Trần',
							givenName: 'An',
							dateOfBirth: '2006-05-29',
						},
					}),
				],
			}),
		);
		apiMock.mockResolvedValueOnce({
			addedCount: 0,
			reactivatedCount: 0,
			filledCount: 0,
			updatedCount: 0,
			skippedCount: 1,
			errorCount: 0,
		});

		render(<StudentIntakeWorkspace classId="class-1" />);
		fireEvent.click(screen.getByRole('tab', { name: 'Dán dữ liệu' }));
		fireEvent.change(screen.getByRole('textbox'), { target: { value: 'conflict' } });
		fireEvent.click(screen.getByRole('button', { name: 'Xem trước dữ liệu dán' }));
		await screen.findByText('Có xung đột');
		expect(screen.getByRole('button', { name: 'Lưu danh sách' })).toBeDisabled();

		fireEvent.click(screen.getByRole('button', { name: 'Giữ toàn bộ dữ liệu hiện tại' }));
		expect(screen.getByRole('button', { name: 'Lưu danh sách' })).toBeEnabled();
		fireEvent.click(screen.getByRole('button', { name: 'Lưu danh sách' }));

		await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(2));
		const commit = JSON.parse(String(apiMock.mock.calls[1]?.[1]?.body)) as {
			rows: Array<{ resolution: Record<string, string> }>;
		};
		expect(commit.rows[0]?.resolution).toEqual({ familyName: 'keep' });
	});
});
