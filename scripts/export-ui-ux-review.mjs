import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'docs');
const outputPath = path.join(outDir, 'ui-ux-expert-review.html');

const now = new Date().toISOString();

const sourceFiles = [
	{
		label: 'Homepage route',
		path: 'src/app/page.tsx',
		why: 'Hero, trust strip, expertise entry points, selected projects, process and final CTA.',
	},
	{
		label: 'Services route',
		path: 'src/app/dich-vu/page.tsx',
		why: 'Service navigation, progressive disclosure, evidence links and service CTAs.',
	},
	{
		label: 'Projects index route',
		path: 'src/app/du-an/page.tsx',
		why: 'Project listing intro, proof note and ProjectGrid integration.',
	},
	{
		label: 'Case study route',
		path: 'src/app/du-an/[slug]/page.tsx',
		why: 'Case-study storytelling sequence, artefacts, impact metrics and contextual CTA.',
	},
	{
		label: 'About route',
		path: 'src/app/gioi-thieu/page.tsx',
		why: 'Professional story, credentials, principles, milestones and proof-linked capabilities.',
	},
	{
		label: 'Contact route',
		path: 'src/app/lien-he/page.tsx',
		why: 'Conversion page structure, mobile anchor and form frame.',
	},
	{
		label: 'Navbar',
		path: 'src/components/site/Navbar.tsx',
		why: 'Desktop CTA, compact scroll state, mobile full-screen menu and focus management.',
	},
	{
		label: 'Contact form',
		path: 'src/components/contact/ContactForm.tsx',
		why: 'Fields, validation, loading, success, error states and inquiry API payload.',
	},
	{
		label: 'Project grid',
		path: 'src/features/portfolio/components/ProjectGrid.tsx',
		why: 'Filter UI, project cards, image treatment and tracking.',
	},
	{
		label: 'Service disclosure',
		path: 'src/components/marketing/ServiceDisclosure.tsx',
		why: 'Mobile progressive disclosure and reduced-motion-compatible interaction.',
	},
	{
		label: 'Premium primitives',
		path: 'src/components/marketing/PremiumPrimitives.tsx',
		why: 'Trust strip, metrics and proof note primitives.',
	},
	{
		label: 'Analytics events',
		path: 'src/lib/analytics.ts',
		why: 'CTA, service, project, form and disclosure event contracts.',
	},
	{
		label: 'Project data model',
		path: 'src/features/portfolio/data/projects.ts',
		why: 'Project content, artefacts, impact, evidence notes, testimonials and CTAs.',
	},
	{
		label: 'Global design system CSS',
		path: 'src/app/globals.css',
		why: 'Design tokens, editorial primitives, responsive behavior, focus and motion rules.',
	},
];

const routes = [
	{
		name: 'Trang chủ',
		url: '/',
		role: 'Primary credibility and conversion entry.',
		blueprint: `<main class="bg-canvas">
  <header class="site-header fixed">
    <a class="brand">Duy Khánh</a>
    <nav class="desktop-nav">Dịch vụ · Dự án · Giới thiệu</nav>
    <a class="primary-cta">Bắt đầu trao đổi</a>
    <button class="mobile-menu-trigger">Menu</button>
  </header>
  <section aria-labelledby="home-title" class="hero">
    <div class="hero-copy">
      <p class="editorial-label">Education · Applied AI · Business Advisory</p>
      <h1 id="home-title">Học để hiểu sâu. Làm để tạo thay đổi.</h1>
      <p class="lead">Giảng viên và người thiết kế trải nghiệm học tập...</p>
      <div class="cta-row">
        <a class="button dark">Bắt đầu trao đổi</a>
        <a class="button outline">Xem dự án chọn lọc</a>
      </div>
      <aside class="proof-note">Tiếp cận dựa trên nghiên cứu...</aside>
    </div>
    <figure class="hero-media">
      <img alt="Minh họa Duy Khánh trên hành trình học hỏi và giảng dạy" />
      <figcaption>Hiểu · Thử · Nhìn lại · Vận dụng</figcaption>
    </figure>
  </section>
  <section class="trust-strip">Vai trò · Nơi công tác · Trọng tâm · Phương pháp</section>
  <section class="approach-statement">Một giải pháp tốt không bắt đầu từ công cụ.</section>
  <section class="expertise-entrypoints">
    <article>Giảng dạy quản trị → bằng chứng dự án</article>
    <article>Đào tạo ứng dụng AI → bằng chứng dự án</article>
    <article>Cố vấn doanh nghiệp → bằng chứng dự án</article>
  </section>
  <section class="selected-projects">Project cards with image, status, summary, impact</section>
  <section class="process">Làm rõ → Thiết kế → Đồng hành</section>
  <section class="closing-cta dark">Bắt đầu trao đổi</section>
</main>`,
		sections: [
			'Fixed editorial header with desktop CTA and mobile menu.',
			'Hero: value proposition and CTA appear before image on mobile; text-image layout on desktop.',
			'Trust strip: role, institution, focus and research-based method.',
			'Approach statement: "Một giải pháp tốt không bắt đầu từ công cụ."',
			'Three collaboration entry points with target audience, outputs and proof links.',
			'Selected projects with imagery, status, summaries and contextual links.',
			'Process sequence and dark final CTA.',
		],
		mobile: [
			'Hero copy and CTAs are first-viewport priorities.',
			'CTA controls use editorial-button classes with mobile-friendly height.',
			'Artwork is below copy and uses Next Image sizes for responsive LCP behavior.',
		],
	},
	{
		name: 'Dịch vụ',
		url: '/dich-vu',
		role: 'Self-routing page for three user needs.',
		blueprint: `<main class="bg-canvas">
  <section class="page-hero">
    <p class="editorial-label">Education · AI · Advisory</p>
    <h1>Tôi có thể hỗ trợ gì?</h1>
    <p class="lead">Ba hướng cộng tác cho ba loại nhu cầu...</p>
    <aside class="proof-note">Mỗi cuộc trao đổi bắt đầu bằng việc làm rõ...</aside>
  </section>
  <nav class="sticky service-nav" aria-label="Chọn hướng hỗ trợ">
    <a href="#management-learning">01 · Học quản trị</a>
    <a href="#applied-ai">02 · Ứng dụng AI</a>
    <a href="#business-advisory">03 · Cố vấn doanh nghiệp</a>
  </nav>
  <section id="management-learning" class="service-section">
    <header><span>01</span><h2>Giảng dạy và hỗ trợ học tập về quản trị</h2><p class="problem">...</p></header>
    <details open class="mobile-progressive-disclosure">
      <summary>Học quản trị</summary>
      <div class="service-details">Dành cho ai · Đầu ra · Cách làm</div>
    </details>
    <footer><a>Bằng chứng</a><a class="button dark">Trao đổi nhu cầu</a></footer>
  </section>
  <section id="applied-ai" class="service-section alternate">...</section>
  <section id="business-advisory" class="service-section">...</section>
  <section class="closing-cta dark">Chưa chắc hướng nào phù hợp?</section>
</main>`,
		sections: [
			'Editorial page intro with proof note.',
			'Sticky horizontal service navigation.',
			'Three service sections: audience, problem, outputs, approach, evidence and CTA.',
			'Final dark CTA for visitors unsure which service fits.',
		],
		mobile: [
			'Native details-based progressive disclosure reduces perceived page length.',
			'First service opens by default; other services are collapsed.',
			'Service navigation scrolls horizontally with 44px minimum touch target.',
		],
	},
	{
		name: 'Dự án',
		url: '/du-an',
		role: 'Proof and case-study entry page.',
		blueprint: `<main class="bg-canvas">
  <section class="projects-index">
    <header>
      <p class="editorial-label">Selected work</p>
      <h1>Dự án</h1>
      <p class="lead">Chương trình học, nghiên cứu và dự án cố vấn...</p>
      <aside class="proof-note">Chỉ số chỉ xuất hiện khi có cơ sở xác minh...</aside>
    </header>
    <div class="filter-row" role="group">
      <button aria-pressed="true">Tất cả</button>
      <button>Giảng dạy quản trị</button>
      <button>Ứng dụng AI</button>
      <button>Tư vấn doanh nghiệp</button>
      <button>Nghiên cứu</button>
    </div>
    <section class="project-grid">
      <article class="project-card">
        <img alt="Project cover" />
        <p class="kicker">Course Design · Applied AI</p>
        <h2>AI50 — AI cho mọi người</h2>
        <p>Status, summary and evidence note</p>
      </article>
    </section>
  </section>
</main>`,
		sections: [
			'Editorial intro with evidence policy.',
			'Mobile-friendly category filter.',
			'Project cards with cover image, category, year, status, summary and impact note.',
			'Links into full case studies.',
		],
		mobile: [
			'Filter row uses horizontal scroll and visible selected state.',
			'Card images use fixed aspect ratio and object positioning for important artwork.',
		],
	},
	{
		name: 'Case study detail',
		url: '/du-an/[slug]',
		role: 'Deep proof page for a selected project.',
		blueprint: `<main class="case-study">
  <nav class="breadcrumb">Dự án / Current case</nav>
  <section class="case-hero">
    <p class="kicker">Category · Year · Status</p>
    <h1>Project title</h1>
    <p class="lead">Project summary</p>
    <img class="cover" alt="Project artefact or cover" />
  </section>
  <section class="case-context">Bối cảnh · Thách thức</section>
  <section class="case-decisions">
    <ol>Decision 01 · Decision 02 · Decision 03</ol>
  </section>
  <section class="artefact-gallery">
    <figure><img alt="Artefact" /><figcaption>Caption</figcaption></figure>
  </section>
  <section class="impact">Verified impact metrics + evidence note</section>
  <section class="lessons">Bài học</section>
  <section class="related-projects">Related case studies</section>
  <section class="contextual-cta">Project-specific inquiry CTA</section>
</main>`,
		sections: [
			'Hero with cover image and project metadata.',
			'Context, problem, approach, deliverables, outcomes and lessons.',
			'Gallery artefacts with captions.',
			'Impact metrics only where evidence is available.',
			'Related projects and contextual contact CTA.',
		],
		mobile: [
			'Image frames keep stable aspect ratios.',
			'Long content remains readable without hover or JavaScript-only behavior.',
		],
	},
	{
		name: 'Giới thiệu',
		url: '/gioi-thieu',
		role: 'Authority-building page for person, philosophy and credentials.',
		blueprint: `<main class="about">
  <section class="about-hero">
    <header>
      <p class="editorial-label">Giới thiệu</p>
      <h1>Tôi làm giáo dục để tiếp tục học.</h1>
      <p class="lead">Nguyễn Duy Khánh — giảng viên quản trị...</p>
      <a class="button dark">Đọc câu chuyện</a>
      <a class="button outline">Xem dự án</a>
    </header>
    <figure><img alt="Minh họa chân dung Duy Khánh" /></figure>
  </section>
  <section class="trust-strip">Công việc · Thiết kế · Nghiên cứu · Cố vấn</section>
  <section id="cau-chuyen" class="professional-story">Four narrative paragraphs + proof note</section>
  <section class="capabilities">Giảng dạy quản trị · Learning & Applied AI · Business Advisory</section>
  <section class="principles">Rõ ràng · Có căn cứ · Thực tế · Có trách nhiệm</section>
  <section class="milestones">Nền tảng · Mở rộng · Thực hành · Hiện tại</section>
  <section class="closing-cta dark">Bắt đầu trao đổi</section>
</main>`,
		sections: [
			'Hero story with portrait/figure image and two CTAs.',
			'Trust strip for role, learning design, research and advisory.',
			'Professional story.',
			'Capabilities linked to proof projects.',
			'Principles, milestones and final CTA.',
		],
		mobile: [
			'Hero remains text-led while keeping image available early.',
			'Capabilities and principles stack into readable single-column sections.',
		],
	},
	{
		name: 'Liên hệ',
		url: '/lien-he',
		role: 'Primary lead-capture and qualification page.',
		blueprint: `<main class="contact">
  <section class="contact-layout">
    <header class="sticky-context-panel">
      <p class="editorial-label">Liên hệ</p>
      <h1>Bắt đầu một cuộc trao đổi.</h1>
      <p class="lead">Hãy chia sẻ điều bạn đang muốn học...</p>
      <a class="mobile-only" href="#contact-form">Điền biểu mẫu</a>
      <div class="desktop-process">Bạn chia sẻ · Tôi xem xét · Hai bên thống nhất</div>
      <aside class="proof-note">Không cần chuẩn bị một đề bài hoàn hảo...</aside>
      <address>Direct email/social links</address>
    </header>
    <section id="contact-form" aria-label="Biểu mẫu liên hệ">
      <div class="form-frame">
        <header><p class="editorial-label">Thông tin trao đổi</p><h2>Hãy để lại vài dòng.</h2></header>
        <form>
          <fieldset>Thông tin liên hệ: name, email, organization</fieldset>
          <fieldset>Nhu cầu: inquiry type, context, timeframe</fieldset>
          <label><input type="checkbox" /> Privacy consent</label>
          <div role="alert">Field or summary errors when invalid</div>
          <button type="submit">Gửi lời nhắn</button>
        </form>
      </div>
    </section>
  </section>
</main>`,
		sections: [
			'Context-setting intro and direct channels.',
			'Mobile "Điền biểu mẫu" anchor.',
			'Desktop process steps beside form.',
			'Grouped one-page inquiry form.',
			'Field-level errors, summary error, pending state and success confirmation.',
		],
		mobile: [
			'Form appears earlier via anchor and condensed intro.',
			'Labels stay visible; field controls have clear focus/error styling.',
		],
	},
];

const reviewQuestions = [
	'Does the editorial premium direction build expert credibility within the first viewport?',
	'Is the mobile hero order effective enough for conversion, or should the image be compressed further?',
	'Are service choices clear for first-time visitors who do not know which offering they need?',
	'Do project cards and case studies provide enough proof when hard KPIs are intentionally limited?',
	'Are CTA labels and destinations specific enough for high-quality inquiries?',
	'Does the contact form collect enough context without creating unnecessary friction?',
	'Are motion, focus, contrast and touch targets consistent with WCAG 2.2 AA expectations?',
	'Where should real photos, artefacts or testimonials replace current placeholder/editorial imagery first?',
];

const expertInstructions = [
	'Review as a UI/UX expert agent for a public professional website.',
	'Prioritize mobile experience at 320px, 375px, 390px and 768px, then desktop at 1024px and 1440px.',
	'Assess visual hierarchy, conversion clarity, credibility proof, accessibility, interaction states and content density.',
	'Flag concrete issues with route, section, viewport and expected user impact.',
	'Do not invent performance or conversion data. Treat unverified KPI gaps as content/evidence gaps.',
	'Recommend fixes using the existing editorial premium direction, not a complete brand reset.',
];

const assetPaths = [
	'public/og-editorial-premium.png',
	'public/brand/learning-as-becoming-mobile.jpg',
	'public/brand/learning-as-becoming-desktop.jpg',
	'public/brand/hero-figure.jpg',
	'public/brand/hero-journey.jpg',
	'public/brand/hero-landscape.jpg',
];

function escapeHtml(value) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
}

function readFile(relativePath) {
	const absolutePath = path.join(root, relativePath);
	if (!fs.existsSync(absolutePath)) {
		return { exists: false, content: '' };
	}
	return { exists: true, content: fs.readFileSync(absolutePath, 'utf8') };
}

function fileMeta(relativePath) {
	const absolutePath = path.join(root, relativePath);
	if (!fs.existsSync(absolutePath)) {
		return { exists: false, bytes: 0, lines: 0 };
	}
	const content = fs.readFileSync(absolutePath, 'utf8');
	return {
		exists: true,
		bytes: Buffer.byteLength(content),
		lines: content.split('\n').length,
	};
}

function renderList(items) {
	return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function renderRoute(route) {
	return `
		<article class="panel">
			<div class="panel-kicker">${escapeHtml(route.url)}</div>
			<h3>${escapeHtml(route.name)}</h3>
			<p class="role">${escapeHtml(route.role)}</p>
			<section class="blueprint">
				<h4>Semantic HTML Blueprint</h4>
				<pre><code>${escapeHtml(route.blueprint)}</code></pre>
			</section>
			<div class="two-col">
				<section>
					<h4>Current Interface Sections</h4>
					${renderList(route.sections)}
				</section>
				<section>
					<h4>Mobile / Responsive Notes</h4>
					${renderList(route.mobile)}
				</section>
			</div>
		</article>`;
}

function renderSource(source) {
	const file = readFile(source.path);
	const meta = fileMeta(source.path);
	return `
		<details class="source-block">
			<summary>
				<span>${escapeHtml(source.label)}</span>
				<small>${escapeHtml(source.path)} · ${meta.exists ? `${meta.lines} lines` : 'missing'}</small>
			</summary>
			<p>${escapeHtml(source.why)}</p>
			${file.exists ? `<pre><code>${escapeHtml(file.content)}</code></pre>` : '<p class="missing">File not found in current workspace.</p>'}
		</details>`;
}

function renderAsset(relativePath) {
	const meta = fileMeta(relativePath);
	const imageSrc = `../${relativePath.replace(/^public\//, 'public/')}`;
	return `
		<figure class="asset">
			<img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(relativePath)}" loading="lazy" />
			<figcaption>
				<strong>${escapeHtml(relativePath)}</strong>
				<span>${meta.exists ? `${Math.round(meta.bytes / 1024)} KB` : 'missing'}</span>
			</figcaption>
		</figure>`;
}

const html = `<!doctype html>
<html lang="vi">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>UI/UX Expert Review Packet - Editorial Premium</title>
	<style>
		:root {
			--canvas: #f8f7f4;
			--paper: #f1efea;
			--ink: #171717;
			--muted: #595650;
			--hairline: #d8d5ce;
			--accent: #765625;
			--dark: #11100e;
			--code: #25221d;
		}
		* { box-sizing: border-box; }
		html { scroll-behavior: smooth; }
		body {
			margin: 0;
			background: var(--canvas);
			color: var(--ink);
			font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
			line-height: 1.6;
		}
		a { color: inherit; }
		.shell { width: min(1180px, calc(100% - 40px)); margin: 0 auto; }
		.hero {
			min-height: 72vh;
			display: grid;
			align-items: end;
			padding: 72px 0 56px;
			border-bottom: 1px solid var(--hairline);
		}
		.kicker, .panel-kicker {
			text-transform: uppercase;
			letter-spacing: .13em;
			font-size: 12px;
			font-weight: 700;
			color: var(--accent);
		}
		h1, h2, h3 {
			margin: 0;
			font-family: Georgia, "Times New Roman", serif;
			letter-spacing: 0;
			line-height: 1;
		}
		h1 { max-width: 11ch; font-size: clamp(52px, 10vw, 120px); margin-top: 24px; }
		h2 { font-size: clamp(36px, 5vw, 68px); margin-bottom: 20px; }
		h3 { font-size: clamp(28px, 3vw, 44px); margin: 10px 0 14px; }
		h4 { margin: 0 0 12px; font-size: 12px; text-transform: uppercase; letter-spacing: .12em; color: var(--accent); }
		.lead { max-width: 760px; margin: 28px 0 0; color: var(--muted); font-size: clamp(18px, 2vw, 24px); line-height: 1.65; }
		.meta {
			margin-top: 34px;
			display: flex;
			flex-wrap: wrap;
			gap: 12px;
			color: var(--muted);
			font-size: 14px;
		}
		.meta span { border: 1px solid var(--hairline); padding: 8px 12px; background: var(--paper); }
		section.band { padding: 64px 0; border-bottom: 1px solid var(--hairline); }
		.grid { display: grid; gap: 18px; }
		.two-col { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; }
		.panel {
			border: 1px solid var(--hairline);
			background: rgba(255,255,255,.28);
			padding: 28px;
		}
		.panel .role { color: var(--muted); margin-top: 0; }
		ul { padding-left: 20px; margin: 0; }
		li + li { margin-top: 8px; }
		.review-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
		.review-card { border-top: 1px solid var(--hairline); padding-top: 18px; color: var(--muted); }
		.source-block {
			border: 1px solid var(--hairline);
			background: var(--paper);
		}
		.source-block + .source-block { margin-top: 12px; }
		summary {
			cursor: pointer;
			display: flex;
			justify-content: space-between;
			gap: 16px;
			padding: 16px 18px;
			font-weight: 700;
		}
		summary small { color: var(--muted); font-weight: 500; }
		.source-block p { margin: 0; padding: 0 18px 16px; color: var(--muted); }
		pre {
			margin: 0;
			max-height: 720px;
			overflow: auto;
			background: var(--code);
			color: #fff9ed;
			padding: 20px;
			font-size: 12px;
			line-height: 1.55;
		}
		code { font-family: "SF Mono", Consolas, ui-monospace, monospace; }
		.asset-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
		.asset { margin: 0; border: 1px solid var(--hairline); background: var(--paper); }
		.asset img { display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-bottom: 1px solid var(--hairline); }
		.asset figcaption { display: grid; gap: 3px; padding: 12px; font-size: 12px; color: var(--muted); overflow-wrap: anywhere; }
		.asset figcaption strong { color: var(--ink); }
		.checklist {
			counter-reset: item;
			display: grid;
			gap: 12px;
			padding: 0;
			margin: 0;
			list-style: none;
		}
		.checklist li {
			counter-increment: item;
			border-left: 2px solid var(--accent);
			padding: 4px 0 4px 14px;
			color: var(--muted);
		}
		.checklist li::before {
			content: counter(item, decimal-leading-zero) " ";
			font-family: "SF Mono", Consolas, ui-monospace, monospace;
			font-size: 11px;
			color: var(--accent);
			margin-right: 8px;
		}
		.footer {
			background: var(--dark);
			color: var(--canvas);
			padding: 40px 0;
			font-size: 14px;
		}
		@media (max-width: 760px) {
			.shell { width: min(100% - 28px, 1180px); }
			.hero { min-height: auto; padding: 48px 0; }
			section.band { padding: 42px 0; }
			.two-col, .review-grid, .asset-grid { grid-template-columns: 1fr; }
			.panel { padding: 20px; }
			summary { display: block; }
			summary small { display: block; margin-top: 6px; }
		}
	</style>
</head>
<body>
	<header class="hero">
		<div class="shell">
			<p class="kicker">UI/UX Expert Review Packet</p>
			<h1>Editorial Premium Interface Export</h1>
			<p class="lead">File này mô tả chi tiết website công khai hiện tại cho expert UI/UX hoặc AI agent review. Nội dung gồm cấu trúc từng route, hành vi mobile, asset đang dùng và source code liên quan được đọc trực tiếp từ workspace.</p>
			<div class="meta">
				<span>Generated: ${escapeHtml(now)}</span>
				<span>Workspace: ${escapeHtml(root)}</span>
				<span>Scope: public website only</span>
			</div>
		</div>
	</header>

	<main>
		<section class="band">
			<div class="shell two-col">
				<div>
					<p class="kicker">Expert Agent Instructions</p>
					<h2>Review Brief</h2>
					<ol class="checklist">${expertInstructions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
				</div>
				<div>
					<p class="kicker">Primary Questions</p>
					<h2>What To Judge</h2>
					<ol class="checklist">${reviewQuestions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
				</div>
			</div>
		</section>

		<section class="band">
			<div class="shell">
				<p class="kicker">Route Map</p>
				<h2>Current Public Interfaces</h2>
				<div class="grid">${routes.map(renderRoute).join('')}</div>
			</div>
		</section>

		<section class="band">
			<div class="shell">
				<p class="kicker">System Snapshot</p>
				<h2>Design System And Interaction Notes</h2>
				<div class="review-grid">
					<div class="review-card">Palette: paper/canvas foundation, dark ink, bronze accent, hairline borders, restrained editorial contrast.</div>
					<div class="review-card">Typography: serif display headings, sans body copy, uppercase editorial labels, mono step numbers.</div>
					<div class="review-card">Layout: constrained shell, border-separated bands, card use limited to repeated evidence/form elements.</div>
					<div class="review-card">Navigation: fixed header, compact scroll state, desktop contact CTA, full-screen mobile menu.</div>
					<div class="review-card">Conversion: contact CTAs appear in hero, service sections, case studies and final page bands.</div>
					<div class="review-card">Accessibility: visible labels, focus-visible rules in CSS, dialog trap in mobile menu, field-level form errors.</div>
				</div>
			</div>
		</section>

		<section class="band">
			<div class="shell">
				<p class="kicker">Visual Assets</p>
				<h2>Current Image References</h2>
				<div class="asset-grid">${assetPaths.map(renderAsset).join('')}</div>
			</div>
		</section>

		<section class="band">
			<div class="shell">
				<p class="kicker">Exact Source Reference</p>
				<h2>Route And Component Code</h2>
				${sourceFiles.map(renderSource).join('')}
			</div>
		</section>
	</main>

	<footer class="footer">
		<div class="shell">Generated for UI/UX expert review. Open this file in a browser for a readable packet, or parse the embedded source blocks directly as an AI agent.</div>
	</footer>
</body>
</html>
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outputPath, html, 'utf8');
console.log(outputPath);
