import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
	VocabApiProvider,
	VocabBackLink,
	VocabPracticeFrame,
	useVocabChrome,
	useVocabScoreUrl,
} from './VocabApiProvider';

function ChromeProbe() {
	const chrome = useVocabChrome();
	const scoreUrl = useVocabScoreUrl()('abc');
	return (
		<p>
			{chrome.embedded ? 'embedded' : 'standalone'} {chrome.setHref('abc')} {scoreUrl}
		</p>
	);
}

describe('VocabChrome', () => {
	it('defaults to standalone vocabulary routes', () => {
		render(<ChromeProbe />);
		expect(screen.getByText('standalone /vocabulary/abc /api/vocab-sets/abc/score')).toBeVisible();
		expect(screen.queryByRole('main')).not.toBeInTheDocument();
	});

	it('hides the hub back link and outer main when embedded', () => {
		render(
			<VocabApiProvider
				endpointFor={() => '/api/x'}
				scoreEndpointFor={() => '/api/class/score'}
				chrome={{
					embedded: true,
					backHref: '/course?view=vocab',
					backLabel: '← Từ vựng',
					setHref: (id) => `/class/${id}`,
					modeHref: (id, mode) => (mode ? `/class/${id}/${mode}` : `/class/${id}`),
				}}
			>
				<VocabBackLink className="back" />
				<VocabPracticeFrame className="min-h-screen">practice</VocabPracticeFrame>
				<ChromeProbe />
			</VocabApiProvider>,
		);
		expect(screen.queryByText('← Từ vựng')).not.toBeInTheDocument();
		expect(screen.queryByRole('main')).not.toBeInTheDocument();
		expect(screen.getByText('practice')).toBeVisible();
		expect(screen.getByText('embedded /class/abc /api/class/score')).toBeVisible();
	});

	it('renders the standalone back link and main frame', () => {
		render(
			<>
				<VocabBackLink />
				<VocabPracticeFrame>practice</VocabPracticeFrame>
			</>,
		);
		expect(screen.getByRole('link', { name: '← Từ vựng' })).toHaveAttribute('href', '/vocabulary');
		expect(screen.getByRole('main')).toHaveTextContent('practice');
	});
});
