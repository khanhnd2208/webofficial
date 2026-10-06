'use client';

import { useEffect, useState } from 'react';

export function useWideStudio() {
	const [wide, setWide] = useState(
		() => typeof window !== 'undefined' && window.matchMedia('(min-width: 64rem)').matches,
	);
	useEffect(() => {
		const query = window.matchMedia('(min-width: 64rem)');
		const apply = () => setWide(query.matches);
		query.addEventListener('change', apply);
		return () => query.removeEventListener('change', apply);
	}, []);
	return wide;
}

export type StudioTab = 'outline' | 'edit' | 'properties';

const TABS: Array<{ id: StudioTab; label: string }> = [
	{ id: 'outline', label: 'Mục lục' },
	{ id: 'edit', label: 'Soạn' },
	{ id: 'properties', label: 'Thuộc tính' },
];

export default function StudioTabs({
	tab,
	onChange,
}: {
	tab: StudioTab;
	onChange: (tab: StudioTab) => void;
}) {
	return (
		<div className="ln-studio__tabs" role="tablist" aria-label="Vùng studio">
			{TABS.map((item) => (
				<button
					key={item.id}
					type="button"
					role="tab"
					aria-selected={tab === item.id}
					onClick={() => onChange(item.id)}
				>
					{item.label}
				</button>
			))}
		</div>
	);
}
