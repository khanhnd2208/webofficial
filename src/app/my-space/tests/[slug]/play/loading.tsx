export default function MySpaceQuizPlayLoading() {
	return (
		<main className="min-h-svh bg-canvas pt-4 pb-28 sm:pt-6 lg:pt-10" aria-busy="true">
			<div className="shell">
				{/* Mobile header skeleton */}
				<div className="mb-4 border-b border-hairline pb-0 lg:hidden">
					<div className="flex items-center gap-3 py-3">
						<div className="h-4 w-16 animate-pulse rounded bg-hairline" />
						<div className="h-4 flex-1 animate-pulse rounded bg-hairline" />
						<div className="h-11 w-24 animate-pulse rounded bg-hairline" />
					</div>
					<div className="h-1 w-full animate-pulse bg-hairline" />
				</div>

				<div className="grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-10">
					{/* Sidebar skeleton — slim, no boxed panels */}
					<aside className="hidden space-y-5 lg:block">
						<div className="h-4 w-16 animate-pulse rounded bg-hairline" />
						<div className="space-y-2">
							<div className="h-3 w-20 animate-pulse rounded bg-hairline" />
							<div className="h-5 w-3/4 animate-pulse rounded bg-hairline" />
						</div>
						<div className="space-y-2">
							<div className="h-4 w-40 animate-pulse rounded bg-hairline" />
							<div className="h-1 w-full animate-pulse rounded-full bg-hairline" />
						</div>
						<div className="h-4 w-28 animate-pulse rounded bg-hairline" />
					</aside>

					{/* Question panel skeleton */}
					<section className="rounded-[var(--radius-sm)] border border-hairline bg-paper/40 p-4 sm:p-6 lg:p-8">
						<div className="hidden items-center justify-between border-b border-hairline pb-4 lg:flex">
							<div className="h-4 w-24 animate-pulse rounded bg-hairline" />
							<div className="h-4 w-28 animate-pulse rounded bg-hairline" />
							<div className="h-11 w-28 animate-pulse rounded bg-hairline" />
						</div>
						<div className="mt-5 space-y-2">
							<div className="h-5 w-full animate-pulse rounded bg-hairline" />
							<div className="h-5 w-4/5 animate-pulse rounded bg-hairline" />
						</div>
						<div className="mt-6 space-y-0 border-t border-hairline">
							{Array.from({ length: 4 }, (_, i) => (
								<div
									key={i}
									className="flex gap-3 border-b border-hairline px-3 py-4"
								>
									<div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-hairline" />
									<div className="h-4 flex-1 animate-pulse rounded bg-hairline" />
								</div>
							))}
						</div>
					</section>
				</div>

				<span className="sr-only">Preparing test…</span>
			</div>
		</main>
	);
}
