import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useStudioShortcuts } from './useStudioShortcuts';

function Harness(props: Parameters<typeof useStudioShortcuts>[0]) {
	useStudioShortcuts(props);
	return <textarea aria-label="Nội dung" />;
}

function setup() {
	const actions = { save: vi.fn(), jump: vi.fn(), preview: vi.fn(), help: vi.fn() };
	const view = render(<Harness {...actions} />);
	return { actions, textarea: view.getByRole('textbox') };
}

describe('useStudioShortcuts', () => {
	it('saves and jumps with Ctrl or Cmd, even while typing', () => {
		const { actions, textarea } = setup();
		fireEvent.keyDown(textarea, { key: 's', ctrlKey: true });
		fireEvent.keyDown(textarea, { key: 'k', metaKey: true });
		fireEvent.keyDown(textarea, { key: 'P', metaKey: true, shiftKey: true });
		expect(actions.save).toHaveBeenCalledTimes(1);
		expect(actions.jump).toHaveBeenCalledTimes(1);
		expect(actions.preview).toHaveBeenCalledTimes(1);
	});

	it('opens help with ? only outside text fields', () => {
		const { actions, textarea } = setup();
		fireEvent.keyDown(textarea, { key: '?' });
		expect(actions.help).not.toHaveBeenCalled();
		fireEvent.keyDown(document.body, { key: '?' });
		expect(actions.help).toHaveBeenCalledTimes(1);
	});
});
