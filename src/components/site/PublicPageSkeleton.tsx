export default function PublicPageSkeleton({ tiles = 3 }: { tiles?: number }) {
	return (
		<main
			className="min-h-svh bg-canvas px-6 pb-20 pt-32"
			aria-busy="true"
			aria-label="Đang tải trang"
		>
			<div className="mx-auto max-w-5xl">
				<div className="h-3 w-32 rounded-lg bg-ink/10" />
				<div className="mt-6 h-12 w-3/4 max-w-lg rounded-lg bg-ink/10" />
				<div className="mt-5 h-5 w-full max-w-xl rounded-lg bg-ink/5" />
				<div className="mt-14 grid gap-6 sm:grid-cols-3">
					{Array.from({ length: tiles }, (_, index) => (
						<div key={index} className="h-52 rounded-2xl border border-hairline bg-paper" />
					))}
				</div>
			</div>
		</main>
	);
}
