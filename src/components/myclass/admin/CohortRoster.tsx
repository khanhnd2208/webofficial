'use client';

import { useState } from 'react';

import { Dialog } from '@/components/ui/Dialog';
import { myClassApi } from './api';

type Membership = {
	id: string;
	email: string;
	name: string;
	status: string;
	userId: string | null;
};

type PreviewRow = { email: string; name: string; ok: boolean; account: string; errors: string[] };

export default function CohortRoster({ cohortId, members }: { cohortId: string; members: Membership[] }) {
	const [email, setEmail] = useState('');
	const [name, setName] = useState('');
	const [csv, setCsv] = useState('');
	const [preview, setPreview] = useState<PreviewRow[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [confirm, setConfirm] = useState<Membership | null>(null);
	function parseCsv(value: string) {
		const lines: string[][] = [];
		let row: string[] = [], cell = '', quoted = false;
		for (let i = 0; i < value.length; i += 1) {
			const char = value[i];
			if (char === '"') { if (quoted && value[i + 1] === '"') { cell += '"'; i += 1; } else quoted = !quoted; }
			else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
			else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && value[i + 1] === '\n') i += 1; row.push(cell); if (row.some((item) => item.trim())) lines.push(row); row = []; cell = ''; }
			else cell += char;
		}
		if (cell || row.length) { row.push(cell); if (row.some((item) => item.trim())) lines.push(row); }
		return lines;
	}

	async function addManual() {
		setError(null);
		try {
			await myClassApi(`/api/admin/my-class/cohorts/${cohortId}/roster`, {
				method: 'POST',
				body: JSON.stringify({ email, name }),
			});
			window.location.reload();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không thêm được');
		}
	}

	async function runPreview() {
		const rows = parseCsv(csv)
			.slice(1)
			.filter((parts) => parts[0]?.trim())
			.map((parts) => ({ email: parts[0]!.trim(), name: (parts[1] ?? '').trim() }));
		const result = await myClassApi<PreviewRow[]>(`/api/admin/my-class/cohorts/${cohortId}/roster`, {
			method: 'POST',
			body: JSON.stringify({ mode: 'preview', rows }),
		});
		setPreview(result);
	}

	async function commit() {
		const rows = preview.filter((row) => row.ok).map((row) => ({ email: row.email, name: row.name }));
		await myClassApi(`/api/admin/my-class/cohorts/${cohortId}/roster`, {
			method: 'POST',
			body: JSON.stringify({ mode: 'commit', rows }),
		});
		window.location.reload();
	}

	return (
		<div className="space-y-6">
			{error ? <p className="text-sm text-error">{error}</p> : null}
			<div className="flex flex-wrap gap-2">
				<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" className="min-h-11 rounded-[var(--mc-r-sm)] border border-mc-rule px-3" />
				<input value={name} onChange={(e) => setName(e.target.value)} placeholder="tên" className="min-h-11 rounded-[var(--mc-r-sm)] border border-mc-rule px-3" />
				<button type="button" onClick={() => void addManual()} className="rounded-[var(--mc-r-sm)] border px-4 text-xs font-bold uppercase">Thêm</button>
			</div>
			<div>
				<p className="text-sm">CSV template: email,name</p>
				<textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={6} className="mt-2 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3 py-2 font-mono text-xs" placeholder={'email,name\nstudent@example.com,An'} />
				<div className="mt-2 flex gap-2">
					<button type="button" onClick={() => void runPreview()} className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] border border-mc-rule px-4 text-sm font-semibold">Preview</button>
					<button type="button" disabled={preview.length === 0 || preview.some((row) => !row.ok)} onClick={() => void commit()} className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-sm font-semibold text-paper">Commit</button>
				</div>
			</div>
			{preview.length ? (
				<table className="w-full text-sm" data-testid="roster-preview">
					<thead><tr><th>Email</th><th>Trạng thái</th><th>Lỗi</th></tr></thead>
					<tbody>
						{preview.map((row) => (
							<tr key={row.email} className={row.ok ? '' : 'text-error'}>
								<td>{row.email}</td>
								<td>{row.account}</td>
								<td>{row.errors.join('; ')}</td>
							</tr>
						))}
					</tbody>
				</table>
			) : null}
			<table className="w-full text-sm">
				<thead><tr><th>Email</th><th>Tên</th><th>Status</th><th></th></tr></thead>
				<tbody>
					{members.map((member) => (
						<tr key={member.id}>
							<td>{member.email}</td>
							<td>{member.name}</td>
							<td>{member.status}</td>
							<td>
								{member.status === 'REMOVED' ? (
									<button type="button" onClick={() => void myClassApi(`/api/admin/my-class/memberships/${member.id}`, { method: 'POST' }).then(() => window.location.reload())}>Reactivate</button>
								) : (
									<button type="button" onClick={() => setConfirm(member)}>Remove</button>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<Dialog open={Boolean(confirm)} onClose={() => setConfirm(null)} title="Gỡ khỏi lớp?">
				<p className="text-sm">Membership sẽ chuyển sang REMOVED và giải phóng khóa active của Course.</p>
				<div className="mt-4 flex justify-end gap-2">
					<button type="button" onClick={() => setConfirm(null)}>Hủy</button>
					<button type="button" onClick={() => confirm && void myClassApi(`/api/admin/my-class/memberships/${confirm.id}`, { method: 'DELETE' }).then(() => window.location.reload())}>Remove</button>
				</div>
			</Dialog>
		</div>
	);
}
