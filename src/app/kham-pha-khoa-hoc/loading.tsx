export default function DiscoverCoursesLoading() {
	return (
		<main
			className="min-h-svh bg-canvas px-6 pb-24 pt-28 sm:px-10 sm:pt-36"
			aria-busy="true"
			aria-label="Đang tải khóa học"
		>
			<div className="mx-auto max-w-6xl animate-pulse">
				<div className="h-3 w-36 rounded bg-ink/10" />
				<div className="mt-7 h-14 max-w-xl rounded bg-ink/10" />
				<div className="mt-5 h-5 max-w-2xl rounded bg-ink/10" />
				<div className="mt-14 grid gap-5 lg:grid-cols-2">
					<div className="h-72 rounded-2xl border border-hairline bg-paper" />
					<div className="h-72 rounded-2xl border border-hairline bg-paper" />
				</div>
			</div>
		</main>
	);
}
