import { api } from './booth-api.js';

export function mountSetup(root, onStarted) {
	const $ = (selector) => root.querySelector(selector);
	const dialog = $('#boothSetup');
	const status = $('#setupStatus');
	const error = $('#setupError');
	const login = $('#setupLogin');
	const pinForm = $('#pinForm');
	const pin = $('#pin');
	const submitPin = $('#submitPin');
	const setupForm = $('#setupForm');
	const total = $('#totalSpins');
	let data;
	let pending = false;
	let setupToken;

	function showError(message = '') {
		error.textContent = message;
		error.hidden = !message;
	}

	function showSetup(state) {
		data = state;
		status.textContent = {
			'needs-admin': 'Quầy chưa có PIN. Đăng nhập quản trị để đặt mã lần đầu.',
			'configure-pin': 'Đặt mã PIN cho quầy. Dùng mã này trên các máy ở sự kiện.',
			unlock: 'Nhập mã PIN của quầy để chỉnh kho và bắt đầu chơi.',
			setup: '',
		}[state.mode];
		pinForm.hidden = !['configure-pin', 'unlock'].includes(state.mode);
		submitPin.textContent = state.mode === 'configure-pin' ? 'Lưu PIN' : 'Tiếp tục';
		login.hidden = state.mode !== 'needs-admin';
		setupForm.hidden = state.mode !== 'setup';
		if (!pinForm.hidden) pin.focus();
		if (state.mode !== 'setup') return;

		const rows = state.prizes.map(({ name, remaining, defaultRemaining }) => {
			const row = document.createElement('label');
			row.className = 'setup-row';
			row.append(name);
			const input = document.createElement('input');
			Object.assign(input, {
				type: 'number',
				inputMode: 'numeric',
				min: '0',
				max: '10000',
				step: '1',
				required: true,
				value: String(defaultRemaining ?? remaining),
			});
			row.append(input);
			return row;
		});
		$('#setupPrizes').replaceChildren(...rows);
		total.value = String(state.defaultTotalSpins ?? state.totalSpins);
	}

	async function run(button, action) {
		if (pending) return;
		pending = true;
		button.disabled = true;
		showError();
		try {
			await action();
		} catch (caught) {
			showError(caught.message || 'Không thể thiết lập quầy.');
		} finally {
			pending = false;
			button.disabled = false;
		}
	}

	$('#openSetup').addEventListener('click', () => {
		pinForm.hidden = true;
		setupForm.hidden = true;
		login.hidden = true;
		pin.value = '';
		status.textContent = 'Đang tải thiết lập…';
		dialog.showModal();
		void run($('#openSetup'), async () => {
			try {
				showSetup(await api('fmt2026/setup'));
			} finally {
				if (status.textContent === 'Đang tải thiết lập…') status.textContent = '';
			}
		});
	});
	dialog.addEventListener('close', () => {
		setupToken = undefined;
		pin.value = '';
	});
	$('#closeSetup').addEventListener('click', () => {
		if (!pending) dialog.close();
	});
	dialog.addEventListener('cancel', (event) => {
		if (pending) event.preventDefault();
	});

	pinForm.addEventListener('submit', (event) => {
		event.preventDefault();
		void run(submitPin, async () => {
			if (data.mode === 'configure-pin') {
				await api('fmt2026/setup', { pin: pin.value }, 'PUT');
				data.mode = 'unlock';
				submitPin.textContent = 'Tiếp tục';
			}
			const unlocked = await api('fmt2026/unlock', { pin: pin.value, setup: true });
			setupToken = unlocked.setupToken;
			pin.value = '';
			showSetup(await api('fmt2026/setup', undefined, 'GET', setupToken));
		});
	});
	setupForm.addEventListener('submit', (event) => {
		event.preventDefault();
		void run(setupForm.querySelector('button[type=submit]'), async () => {
			const inputs = $('#setupPrizes').querySelectorAll('input');
			const prizes = data.prizes
				.map(({ id, remaining }, index) => ({
					id,
					previousRemaining: remaining,
					remaining: inputs[index].valueAsNumber,
				}))
				.filter(({ previousRemaining, remaining }) => previousRemaining !== remaining);
			await api(
				'fmt2026/setup',
				{
					totalSpins: total.valueAsNumber,
					previousTotalSpins: data.totalSpins,
					prizes,
				},
				'POST',
				setupToken,
			);
			dialog.close();
			await onStarted();
		});
	});
}
