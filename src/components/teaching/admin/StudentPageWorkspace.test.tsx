import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TeachingClassRecord } from '@/features/teaching/types';
import { StudentPageWorkspace } from './StudentPageWorkspace';
import { teachingApi } from './api';
vi.mock('./api', () => ({ teachingApi: vi.fn() }));
const teachingClass: TeachingClassRecord = {
	id: 'class-1',
	courseId: 'course-1',
	courseCode: 'HRM101',
	courseName: 'HRM',
	groupNo: '01',
	classCode: '01',
	term: 'HK1',
	credits: 3,
	lecturerName: '',
	lecturerCode: '',
	totalWeeks: 10,
	attendanceMaxPoints: 5,
	cpMaxPoints: 5,
	absenceDeductionPoints: 0.5,
	lateDeductionPoints: 0.5,
	lateCountsTowardAbsenceThreshold: true,
	giftDeductionPoints: 1,
	absenceThresholdPercent: 20,
	lateGraceMinutes: 15,
	status: 'ACTIVE',
	publicSlug: null,
	publicTitle: '',
	publicSummary: '',
	publicDescription: '',
	publicAnnouncement: '',
	attendanceVisible: false,
	classRules: '',
	createdAt: '2026-09-01T00:00:00.000Z',
	updatedAt: '2026-09-01T00:00:00.000Z',
};

describe('saved student page settings', () => {
 beforeEach(() => { vi.mocked(teachingApi).mockReset(); });
 function renderPage() {
  const sharedClass = {...teachingClass, attendanceVisible:true, publicSlug:'saved-class', publicSummary:'Giới thiệu lớp'};
  render(<StudentPageWorkspace page={{class:sharedClass,links:[]}} board={{class:sharedClass,attendanceVisible:true,classRules:'Nội quy đã lưu',publicPath:'/lop/saved-class'}} />);
  return sharedClass;
 }
 it('keeps both open links on the saved slug while editing, and retains duplicate-slug errors in the form', async () => {
  renderPage();
  fireEvent.change(screen.getByLabelText(/Đường dẫn trang sinh viên/), {target:{value:'duplicate'}});
  for (const link of screen.getAllByRole('link').filter(link=>link.getAttribute('href')?.startsWith('/lop/'))) {
   expect(link).toHaveAttribute('href','/lop/saved-class');
  }
  vi.mocked(teachingApi).mockRejectedValueOnce(new Error('Đường dẫn đã được sử dụng'));
  fireEvent.click(screen.getByRole('button',{name:'Lưu nội dung'}));
  await act(async () => {});
  expect(screen.getByRole('alert')).toHaveTextContent('Đường dẫn đã được sử dụng');
  expect(screen.getByRole('alert').closest('form')).not.toBeNull();
  expect(screen.getByLabelText(/Đường dẫn trang sinh viên/)).toHaveValue('duplicate');
 });
 it('toggles sharing without saving or clearing unsaved rules and updates both panels', async () => {
  const sharedClass = renderPage();
  fireEvent.change(screen.getByLabelText(/Nội quy lớp/), {target:{value:'Nội quy chưa lưu'}});
  vi.mocked(teachingApi).mockResolvedValueOnce({class:{...sharedClass,attendanceVisible:false},attendanceVisible:false,classRules:'Nội quy đã lưu',publicPath:'/lop/saved-class'});
  fireEvent.click(screen.getByRole('button',{name:'Tắt chia sẻ'}));
  await act(async () => {});
  expect(teachingApi).toHaveBeenCalledWith(expect.stringContaining('/share'),expect.objectContaining({body:JSON.stringify({shared:false})}));
  expect(screen.getByLabelText(/Nội quy lớp/)).toHaveValue('Nội quy chưa lưu');
  expect(screen.getAllByText('Chưa chia sẻ')).toHaveLength(2);
 });
});
