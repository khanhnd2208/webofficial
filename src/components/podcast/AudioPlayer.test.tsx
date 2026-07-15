/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import AudioPlayer from '@/components/podcast/AudioPlayer';
import JourneyLine from '@/components/motion/JourneyLine';
import MotionProvider from '@/components/motion/MotionProvider';

function wrap(ui: React.ReactElement) {
	return render(<MotionProvider>{ui}</MotionProvider>);
}

describe('AudioPlayer', () => {
	it('does not attach audio src until first interaction', () => {
		wrap(<AudioPlayer audioUrl="/audio/demo.mp3" title="Demo" durationLabel="1:00" />);
		const audio = document.querySelector('audio');
		expect(audio).toBeTruthy();
		expect(audio?.getAttribute('src')).toBeNull();
		expect(audio?.preload).toBe('none');
		fireEvent.click(screen.getByRole('button', { name: 'Phát' }));
		// src may be set asynchronously; after click the element should still exist and not autoplay attribute
		expect(audio?.hasAttribute('autoplay')).toBe(false);
	});
});

describe('JourneyLine', () => {
	it('renders an svg path', () => {
		const { container } = wrap(<JourneyLine />);
		expect(container.querySelector('svg path')).toBeTruthy();
	});
});
