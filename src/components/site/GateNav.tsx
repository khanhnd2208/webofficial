import Link from 'next/link';
import { GATE_NAV_ITEMS, isGateItemLocked } from '@/config/navigation';

export default function GateNav() {
	return (
		<nav aria-label="Cổng trang" className="book-toc">
			<ol>
				{GATE_NAV_ITEMS.map((item, index) => (
					<li key={item.id}>
						{isGateItemLocked(item) || !item.href ? (
							<div className="book-toc-row" data-testid="gate-item-locked">
								<span className="book-caption">{String(index + 1).padStart(2, '0')}</span>
								<div>
									<span className="book-toc-title">{item.label}</span>
									<p className="book-caption">Không gian này đang được hoàn thiện.</p>
								</div>
							</div>
						) : (
							<Link href={item.href} className="book-toc-row" data-testid={`gate-item-${item.id}`}>
								<span className="book-caption">{String(index + 1).padStart(2, '0')}</span>
								<div>
									<span className="book-toc-title">{item.label}</span>
									<p>{item.blurb}</p>
								</div>
								<span className="book-toc-arrow" aria-hidden="true">
									↗
								</span>
							</Link>
						)}
					</li>
				))}
			</ol>
		</nav>
	);
}
