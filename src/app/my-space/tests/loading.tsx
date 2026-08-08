export default function MySpaceTestsLoading() {
	return (
		<main className="min-h-svh bg-canvas pt-20 pb-24 sm:pt-24 sm:pb-28" aria-busy="true">
			<div className="shell">
				<header className="max-w-[42rem] border-t border-hairline pt-6">
					<div className="h-3 w-20 animate-pulse rounded bg-hairline" />
					<div className="mt-5 h-10 w-40 animate-pulse rounded bg-hairline" />
					<div className="mt-4 h-4 w-full max-w-md animate-pulse rounded bg-hairline" />
				</header>

				<div className="mt-10 sm:mt-12">
					{/* Mobile skeleton */}
					<div className="space-y-0 divide-y divide-hairline border-y border-hairline lg:hidden">
						{Array.from({ length: 3 }, (_, i) => (
							<div key={i} className="flex items-center justify-between py-4">
								<div className="h-5 w-36 animate-pulse rounded bg-hairline" />
								<div className="h-3 w-12 animate-pulse rounded bg-hairline" />
							</div>
						))}
					</div>

					{/* Desktop skeleton */}
					<div className="hidden lg:grid lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-10">
						<div className="space-y-0 divide-y divide-hairline border-y border-hairline">
							{Array.from({ length: 4 }, (_, i) => (
								<div key={i} className="flex items-center justify-between py-3.5">
									<div className="h-4 w-28 animate-pulse rounded bg-hairline" />
									<div className="h-3 w-6 animate-pulse rounded bg-hairline" />
								</div>
							))}
						</div>
						<div className="space-y-0 divide-y divide-hairline border-t border-hairline">
							{Array.from({ length: 2 }, (_, i) => (
								<div key={i} className="flex justify-between gap-6 py-5">
									<div className="flex-1 space-y-2">
										<div className="h-5 w-2/3 animate-pulse rounded bg-hairline" />
										<div className="h-3 w-40 animate-pulse rounded bg-hairline" />
									</div>
									<div className="h-11 w-24 shrink-0 animate-pulse rounded bg-hairline" />
								</div>
							))}
						</div>
					</div>
				</div>

				<span className="sr-only">Loading tests…</span>
			</div>
		</main>
	);
}
