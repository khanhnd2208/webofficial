'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';

type StoreSet = {
	id: string;
	title: string;
	description: string;
	ownerName: string;
	termCount: number;
	updatedAt: string;
};

export default function StorePage() {
	const [items, setItems] = useState<StoreSet[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [search, setSearch] = useState('');
	const [cloning, setCloning] = useState<string | null>(null);
	const [clonedIds, setClonedIds] = useState<Set<string>>(new Set());
	const [toast, setToast] = useState<string | null>(null);

	useEffect(() => {
		async function fetchStore() {
			try {
				const res = await fetch('/api/vocab-sets/store');
				const json = await res.json();
				if (!json.ok) { setError(json.error); return; }
				setItems(json.data.items);
			} catch {
				setError('Có lỗi xảy ra');
			} finally {
				setLoading(false);
			}
		}
		fetchStore();
	}, []);

	const handleClone = useCallback(async (sourceId: string, title: string) => {
		if (cloning) return;
		setCloning(sourceId);
		try {
			const res = await fetch('/api/vocab-sets/store', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sourceId }),
			});
			const json = await res.json();
			if (json.ok) {
				setClonedIds((prev) => new Set(prev).add(sourceId));
				setToast(`Đã tải "${title}" vào bộ từ của bạn!`);
				setTimeout(() => setToast(null), 3000);
			} else {
				setToast(`Lỗi: ${json.error}`);
				setTimeout(() => setToast(null), 3000);
			}
		} catch {
			setToast('Có lỗi xảy ra khi tải bộ từ');
			setTimeout(() => setToast(null), 3000);
		} finally {
			setCloning(null);
		}
	}, [cloning]);

	const filtered = search.trim()
		? items.filter(
			(s) =>
				s.title.toLowerCase().includes(search.toLowerCase()) ||
				s.description.toLowerCase().includes(search.toLowerCase())
		)
		: items;

	if (loading) {
		return (
			<main className="min-h-screen">
				<div className="mx-auto max-w-5xl px-6 py-20 text-center">
					<div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
					<p className="mt-4 text-xs text-muted">Đang tải cửa hàng...</p>
				</div>
			</main>
		);
	}

	if (error) {
		return (
			<main className="min-h-screen flex items-center justify-center">
				<p className="text-sm text-error">{error}</p>
			</main>
		);
	}

	return (
		<main className="min-h-screen">
			{/* Toast notification */}
			{toast && (
				<div
					className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-bold text-foreground shadow-lg"
					style={{ animation: 'toastIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
				>
					{toast}
				</div>
			)}

			{/* Header */}
			<section className="border-b border-border">
				<div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
					<div className="flex items-center gap-3">
						<Link href="/vocabulary" className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors">
							Từ vựng
						</Link>
						<span className="text-xs text-muted">/</span>
						<span className="text-xs font-bold uppercase tracking-widest text-foreground">Cửa hàng</span>
					</div>
					<div className="mt-4 flex items-end justify-between gap-4">
						<div>
							<h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl lg:text-4xl">
								Cửa hàng từ vựng
							</h1>
							<p className="mt-2 text-sm text-foreground-secondary">
								Khám phá bộ sưu tập từ vựng do Admin tuyển chọn. Tải về để luyện tập ngay.
							</p>
						</div>
						<Link
							href="/vocabulary"
							className="hidden shrink-0 items-center gap-2 rounded-full border-2 border-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground transition-all hover:border-foreground sm:inline-flex"
						>
							Bộ từ của tôi
						</Link>
					</div>
				</div>
			</section>

			{/* Stats bar */}
			<section className="border-b border-border">
				<div className="mx-auto max-w-5xl px-6">
					<div className="flex items-center gap-8 py-5">
						<div>
							<div className="text-xl font-black tracking-tight text-rose sm:text-2xl">{items.length}</div>
							<div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted">Bộ từ có sẵn</div>
						</div>
						<div className="h-8 w-px bg-border" />
						<div>
							<div className="text-xl font-black tracking-tight text-teal sm:text-2xl">
								{items.reduce((s, i) => s + i.termCount, 0)}
							</div>
							<div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted">Tổng từ vựng</div>
						</div>
					</div>
				</div>
			</section>

			{/* Search */}
			<section className="border-b border-border bg-surface/50">
				<div className="mx-auto max-w-5xl px-6 py-4">
					<div className="relative">
						<svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
						</svg>
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Tìm bộ từ vựng..."
							className="w-full border border-border bg-surface py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted focus:border-rose focus:outline-none"
						/>
					</div>
				</div>
			</section>

			{/* Store items */}
			<section>
				<div className="mx-auto max-w-5xl px-6 py-10 sm:py-12">
					{/* Mobile link back */}
					<Link
						href="/vocabulary"
						className="mb-6 flex items-center gap-3 border border-border p-4 transition-colors hover:bg-surface-hover sm:hidden"
					>
						<div className="flex h-10 w-10 shrink-0 items-center justify-center bg-accent-subtle text-accent">
							<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
							</svg>
						</div>
						<div>
							<div className="text-sm font-bold uppercase tracking-wider text-foreground">Bộ từ của tôi</div>
							<div className="mt-0.5 text-xs text-muted">Quay lại danh sách</div>
						</div>
						<span className="ml-auto text-xs font-bold text-muted">→</span>
					</Link>

					{filtered.length === 0 ? (
						<div className="border-2 border-dashed border-border p-16 text-center">
							<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-hover">
								<svg className="h-7 w-7 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0h18" />
								</svg>
							</div>
							<p className="mt-5 text-sm font-medium text-foreground">
								{items.length === 0
									? 'Cửa hàng đang trống'
									: 'Không tìm thấy bộ từ phù hợp'}
							</p>
							<p className="mt-1 text-xs text-muted">
								{items.length === 0
									? 'Admin chưa đăng bộ từ nào lên cửa hàng.'
									: 'Thử tìm với từ khóa khác.'}
							</p>
						</div>
					) : (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{filtered.map((set) => {
								const isCloned = clonedIds.has(set.id);
								const isCloning = cloning === set.id;

								return (
									<div
										key={set.id}
										className="group relative border border-border p-5 transition-all hover:bg-surface-hover"
										style={{ animation: 'storeCardIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
									>
										{/* Badge */}
										<div className="mb-3 flex items-center gap-2">
											<span className="rounded-full bg-rose-subtle px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-rose">
												Cửa hàng
											</span>
											<span className="text-[10px] font-bold text-muted">
												{set.termCount} từ
											</span>
										</div>

										<h3 className="text-sm font-bold uppercase tracking-tight text-foreground">
											{set.title}
										</h3>
										{set.description ? (
											<p className="mt-2 line-clamp-2 text-xs text-foreground-secondary">{set.description}</p>
										) : null}

										<div className="mt-3 flex items-center gap-2 text-[10px] text-muted">
											<span>Bởi {set.ownerName}</span>
											<span>·</span>
											<time>
												{new Date(set.updatedAt).toLocaleDateString('vi-VN', {
													year: 'numeric',
													month: 'short',
													day: 'numeric',
												})}
											</time>
										</div>

										{/* Clone button */}
										<div className="mt-4">
											{isCloned ? (
												<span className="inline-flex items-center gap-1.5 text-xs font-bold text-success">
													<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
														<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
													</svg>
													Đã tải về
												</span>
											) : (
												<button
													onClick={() => handleClone(set.id, set.title)}
													disabled={isCloning}
													className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground disabled:opacity-50 active:scale-95"
												>
													{isCloning ? (
														<>
															<div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background border-t-transparent" />
															Đang tải...
														</>
													) : (
														<>
															<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
																<path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
															</svg>
															Tải về
														</>
													)}
												</button>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</section>

			<style>{`
				@keyframes storeCardIn {
					0% { transform: translateY(16px); opacity: 0; }
					100% { transform: translateY(0); opacity: 1; }
				}
				@keyframes toastIn {
					0% { transform: translate(-50%, -20px); opacity: 0; }
					100% { transform: translate(-50%, 0); opacity: 1; }
				}
			`}</style>
		</main>
	);
}
