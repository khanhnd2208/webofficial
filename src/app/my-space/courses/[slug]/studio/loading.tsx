export default function StudioLoading() {
	return (
		<div className="ln-studio" aria-busy="true" aria-label="Đang mở studio">
			<div className="ln-studio__bar" />
			<div className="ln-studio__grid">
				<div className="ln-skeleton" />
				<div className="ln-skeleton" />
				<div className="ln-skeleton" />
			</div>
		</div>
	);
}
