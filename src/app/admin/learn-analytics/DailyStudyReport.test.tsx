import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DailyStudyReport } from './DailyStudyReport';

afterEach(cleanup);

describe('daily study summary', () => {
	it('includes zero-time days in the calendar average and shows the longest study day', () => {
		render(
			<DailyStudyReport
				daily={[
					{ day: '2026-10-01', seconds: 120, learners: 2, sessions: 3, averageSeconds: 60 },
					{ day: '2026-10-02', seconds: 0, learners: 0, sessions: 0, averageSeconds: 0 },
					{ day: '2026-10-03', seconds: 60, learners: 1, sessions: 1, averageSeconds: 60 },
				]}
			/>,
		);
		expect(
			screen.getByText(/2 ngày có học · TB \/ ngày trong khoảng đã chọn: 1 phút/),
		).toBeInTheDocument();
		expect(screen.getByText(/Ngày học nhiều nhất: 1\/10\/2026 \(2 phút\)/)).toBeInTheDocument();
		const zeroDay = screen.getByRole('row', { name: '2/10/2026 0 0 0 giây —' });
		expect(within(zeroDay).getByText('—')).toBeInTheDocument();
		expect(screen.getByText(/Ngày trước khi bắt đầu theo dõi/)).toBeInTheDocument();
	});
	it('renders a clear empty state and avoids a fictional peak date', () => {
		render(
			<DailyStudyReport
				daily={[{ day: '2026-10-03', seconds: 0, learners: 0, sessions: 0, averageSeconds: 0 }]}
			/>,
		);
		expect(screen.getByText('Chưa có thời gian học trong khoảng đã chọn.')).toBeInTheDocument();
		expect(screen.queryByText(/Ngày học nhiều nhất/)).not.toBeInTheDocument();
	});
});
