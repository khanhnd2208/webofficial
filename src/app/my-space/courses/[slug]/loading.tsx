export default function LearnCourseLoading() {
	return (
		<div className="ln-frame" aria-busy="true" aria-label="Đang mở mục học">
			<header className="ln-topbar">
				<span className="ln-topbar__title">Đang tải…</span>
			</header>
			<div className="ln-frame__body">
				<aside className="ln-frame__outline" aria-hidden="true">
					<div className="ln-outline-head">
						<p className="ln-outline-head__line">Mục lục</p>
						<div className="ln-bar ln-bar--thin">
							<span style={{ width: '0%' }} />
						</div>
					</div>
				</aside>
				<main className="ln-frame__main">
					<article className="ln-reader">
						<p className="ln-reader__eyebrow">Đang mở mục</p>
						<h1 className="ln-reader__title"> </h1>
						<p className="ln-reader__meta"> </p>
						<p className="ln-reader__lead"> </p>
					</article>
				</main>
			</div>
		</div>
	);
}
