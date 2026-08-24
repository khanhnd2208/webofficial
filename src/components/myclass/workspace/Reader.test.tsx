import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

import Reader from './Reader';
import type { MyClassOutlineItem } from '@/features/my-class/domain/learnerState';
import type { ReadingLevel } from '@/features/my-class/domain/readingLevel';

const selected = {
	courseId: 'c1',
	courseSlug: 'hrm',
	lessonId: 'l1',
	knowledgeUnitId: 'k1',
	knowledgeUnitSlug: 'a',
	title: 'Nội dung A',
	summary: 'Tóm tắt nội dung A.',
	lessonSlug: 'lesson-1',
	lessonTitle: 'Bài 1',
	sectionId: 's1',
	sectionSlug: 'nen-tang',
	sectionTitle: 'Nền tảng',
	availableLevels: ['readable', 'academic', 'deep'],
	position: 0,
	status: 'current',
} satisfies MyClassOutlineItem;

function ControlledReader({
	initialLevel = 'readable' as ReadingLevel,
}: {
	initialLevel?: ReadingLevel;
}) {
	const [activeLevel, setActiveLevel] = useState<ReadingLevel>(initialLevel);
	return (
		<Reader
			selected={selected}
			headingRef={createRef()}
			loading={false}
			loadError={null}
			onRetry={vi.fn()}
			blocks={[
				{ level: 'readable', html: '<p>Bản dễ hiểu</p>', headings: [] },
				{ level: 'academic', html: '<p>Bản học thuật</p>', headings: [] },
				{ level: 'deep', html: '<p>Bản chuyên sâu</p>', headings: [] },
			]}
			activeLevel={activeLevel}
			onSelectLevel={setActiveLevel}
			onComplete={vi.fn()}
			nextTitle={null}
			desktop
			contentKey="k1"
			position={{
				lessonNumber: '01',
				lessonTitle: 'Bài 1',
				sectionTitle: 'Nền tảng',
				indexInSection: 1,
				sectionTotal: 3,
			}}
		/>
	);
}

describe('Reader level blocks', () => {
	it('shows a segmented level switcher and one active reading column', async () => {
		const user = userEvent.setup();
		render(<ControlledReader />);

		expect(screen.getByRole('heading', { name: 'Nội dung A' })).toBeVisible();
		expect(screen.getByText('Tóm tắt nội dung A.')).toBeVisible();
		expect(screen.getByText(/Bài 01/)).toBeVisible();
		expect(screen.getByText(/Nền tảng/)).toBeVisible();
		expect(screen.getByText('Dễ hiểu')).toBeVisible();
		expect(screen.getByText('Học thuật')).toBeVisible();
		expect(screen.getByText('Chuyên sâu')).toBeVisible();
		expect(screen.getByRole('tablist', { name: 'Mức độ đọc' })).toBeVisible();
		expect(screen.getByText('Bản dễ hiểu')).toBeVisible();
		expect(screen.queryByText('Bản học thuật')).not.toBeInTheDocument();

		await user.click(screen.getByRole('tab', { name: 'Học thuật' }));
		expect(screen.getByText('Bản học thuật')).toBeVisible();
		expect(screen.queryByText('Bản dễ hiểu')).not.toBeInTheDocument();
	});
});
