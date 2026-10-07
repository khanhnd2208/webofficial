import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import LearnMermaid from './LearnMermaid';

const { renderDiagram, initialize } = vi.hoisted(() => ({
	renderDiagram: vi.fn(),
	initialize: vi.fn(),
}));
vi.mock('mermaid', () => ({ default: { render: renderDiagram, initialize } }));

let observers: Array<(entries: Array<{ isIntersecting: boolean }>) => void>;
beforeEach(() => {
	observers = [];
	renderDiagram.mockReset();
	initialize.mockReset();
	renderDiagram.mockImplementation(async (id: string, source: string) => ({
		svg: `<svg id="${id}"><text>${source}</text></svg>`,
	}));
	vi.stubGlobal(
		'IntersectionObserver',
		class {
			constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
				observers.push(callback);
			}
			observe() {}
			disconnect() {}
		},
	);
});
afterEach(() => vi.unstubAllGlobals());

async function approach() {
	await act(async () => observers.at(-1)!([{ isIntersecting: true }]));
}

describe('LearnMermaid', () => {
	it('defers rendering until the diagram approaches the viewport', async () => {
		render(<LearnMermaid source="first-chart" />);
		expect(renderDiagram).not.toHaveBeenCalled();
		await approach();
		await waitFor(() => expect(screen.getByText('first-chart')).toBeVisible());
		expect(initialize).toHaveBeenCalledWith(expect.objectContaining({ securityLevel: 'strict' }));
	});

	it('clears old output on source changes and reuses an instance cache', async () => {
		const { rerender } = render(<LearnMermaid source="cached-chart" />);
		await approach();
		await screen.findByText('cached-chart');
		rerender(<LearnMermaid source="second-chart" />);
		expect(screen.queryByText('cached-chart')).not.toBeInTheDocument();
		await approach();
		await screen.findByText('second-chart');
		rerender(<LearnMermaid source="cached-chart" />);
		await screen.findByText('cached-chart');
		expect(renderDiagram).toHaveBeenCalledTimes(2);
	});

	it('shows the current source after a render failure', async () => {
		renderDiagram.mockRejectedValueOnce(new Error('bad diagram'));
		render(<LearnMermaid source="invalid-chart" />);
		await approach();
		await screen.findByText('Không vẽ được sơ đồ');
		expect(screen.getByText('invalid-chart')).toBeVisible();
	});
});
