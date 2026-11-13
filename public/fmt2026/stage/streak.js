// Chuỗi "chuẩn khe" của cả quầy: người sau cố giữ chuỗi của người trước.
// Chỉ là trò vui trên màn hình; không ảnh hưởng tới kết quả rút quà.
const BEST_KEY = 'fmt2026.bestStreak';

function readBest() {
	try {
		return Math.max(0, Number.parseInt(localStorage.getItem(BEST_KEY) ?? '0', 10) || 0);
	} catch {
		return 0;
	}
}

export function createStreak(el) {
	const count = el.querySelector('[data-streak-count]');
	const bestEl = el.querySelector('[data-streak-best]');
	let current = 0;
	let best = readBest();

	function render() {
		el.hidden = false;
		el.dataset.live = String(current > 0);
		el.dataset.heat = String(Math.min(3, current));
		count.textContent = '×' + current;
		bestEl.textContent = best > 1 ? 'Kỷ lục ×' + best : '';
		bestEl.hidden = best < 2;
	}

	// Trả về chuỗi hiện tại và việc có vừa lập kỷ lục mới hay không.
	function record(perfect) {
		if (!perfect) {
			const lost = current;
			current = 0;
			render();
			return { current, lost, isRecord: false };
		}
		current += 1;
		const isRecord = current > best && current > 1;
		if (current > best) {
			best = current;
			try {
				localStorage.setItem(BEST_KEY, String(best));
			} catch {
				// Trình duyệt chặn lưu: kỷ lục chỉ giữ trong phiên này.
			}
		}
		render();
		el.classList.remove('bump');
		void el.offsetWidth;
		el.classList.add('bump');
		return { current, lost: 0, isRecord };
	}

	render();
	return {
		record,
		get current() {
			return current;
		},
	};
}
