export default function MySpaceQuizPlayLoading() {
	return (
		<main className="min-h-svh bg-canvas pt-4 pb-28 sm:pt-6 lg:pt-10" aria-busy="true">
			<div className="shell">
				{/* Mobile header skeleton */}
				<div className="mb-4 border-b border-hairline pb-3 lg:hidden">
					<div className="flex items-center gap-3">
						<div className="h-4 w-16 animate-pulse rounded bg-hairline" />
						<div className="h-4 flex-1 animate-pulse rounded bg-hairline" />
						<div className="h-11 w-20 animate-pulse rounded bg-hairline" />
					</div>
					<div className="mt-3 h-1.5 w-full animate-pulse rounded-full bg-hairline" />
				</div>

				<div className="grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-10">
					{/* Sidebar skeleton */}
					<aside className="hidden space-y-4 lg:block">
						<div className="h-4 w-16 animate-pulse rounded bg-hairline" />
						<div className="rounded-[var(--radius-sm)] border border-hairline bg-paper/40 p-5">
							<div className="h-3 w-16 animate-pulse rounded bg-hairline" />
							<div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-hairline" />
							<div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-hairline" />
						</div>
						<div className="rounded-[var(--radius-sm)] border border-hairline bg-paper/40 p-5">
							<div className="h-3 w-16 animate-pulse rounded bg-hairline" />
							<div className="mt-3 grid grid-cols-5 gap-2">
								{Array.from({ length: 10 }, (_, i) => (
									<div
										key={i}
										className="h-11 animate-pulse rounded bg-hairline"
									/>
								))}
							</div>
						</div>
					</aside>

					{/* Question panel skeleton */}
					<section className="rounded-[var(--radius-sm)] border border-hairline bg-paper/40 p-4 sm:p-6 lg:p-8">
						<div className="hidden items-center justify-between border-b border-hairline pb-4 lg:flex">
							<div className="h-4 w-24 animate-pulse rounded bg-hairline" />
							<div className="h-4 w-20 animate-pulse rounded bg-hairline" />
							<div className="h-11 w-28 animate-pulse rounded bg-hairline" />
						</div>
						<div className="mt-5 h-4 w-40 animate-pulse rounded bg-hairline" />
						<div className="mt-4 space-y-2">
							<div className="h-5 w-full animate-pulse rounded bg-hairline" />
							<div className="h-5 w-4/5 animate-pulse rounded bg-hairline" />
						</div>
						<div className="mt-6 space-y-0 border-t border-hairline">
							{Array.from({ length: 4 }, (_, i) => (
								<div
									key={i}
									className="flex gap-3 border-b border-hairline px-3 py-4"
								>
									<div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-hairline" />
									<div className="h-4 flex-1 animate-pulse rounded bg-hairline" />
								</div>
							))}
						</div>
					</section>
				</div>

				<span className="sr-only">Đang tạo bài test…</span>
			</div>
		</main>
	);
}
