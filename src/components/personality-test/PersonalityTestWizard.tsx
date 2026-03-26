'use client';

/* ════════════════════════════════════════════════════════════════════════
   PersonalityTestWizard — Multi-step test-taking experience
   
   Two sections:
   1. BFI-2-S (30 items) — "The Light" (OCEAN)
   2. SD3 (27 items) — "The Dark" (Dark Triad)
   
   Features:
   - Paginated questions (5 per page)
   - Progress tracking
   - Timer
   - Smooth transitions with framer-motion
   - Responsive Likert scale UI
   ════════════════════════════════════════════════════════════════════════ */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import type { QuestionConfig, RawResponse, TestConfigDTO, DemographicData } from '@/types/personalityTest';

// ─── Constants ─────────────────────────────────────────────────────────────────

const QUESTIONS_PER_PAGE = 5;

const LIKERT_OPTIONS = [
	{ value: 1, label: 'Rất không đồng ý', labelEn: 'Strongly Disagree', shortLabel: '1' },
	{ value: 2, label: 'Không đồng ý', labelEn: 'Disagree', shortLabel: '2' },
	{ value: 3, label: 'Trung lập', labelEn: 'Neutral', shortLabel: '3' },
	{ value: 4, label: 'Đồng ý', labelEn: 'Agree', shortLabel: '4' },
	{ value: 5, label: 'Rất đồng ý', labelEn: 'Strongly Agree', shortLabel: '5' },
];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Props {
	config: TestConfigDTO;
	onSubmit: (demographics: DemographicData, responses: RawResponse[], durationSeconds: number) => Promise<void>;
	isSubmitting: boolean;
}

type TestPhase = 'intro' | 'demographics' | 'bfi' | 'transition' | 'sd3' | 'review';

// ─── Student Year Options ──────────────────────────────────────────────────────

const STUDENT_YEAR_OPTIONS = [
	{ value: 1, label: 'Năm 1' },
	{ value: 2, label: 'Năm 2' },
	{ value: 3, label: 'Năm 3' },
	{ value: 4, label: 'Năm 4' },
	{ value: 5, label: 'Năm 5+' },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PersonalityTestWizard({ config, onSubmit, isSubmitting }: Props) {
	const [phase, setPhase] = useState<TestPhase>('intro');
	const [currentPage, setCurrentPage] = useState(0);
	const [answers, setAnswers] = useState<Record<string, number>>({});
	const [demographics, setDemographics] = useState<DemographicData>({
		fullName: '',
		university: '',
		studentYear: 1,
		cumulativeGpa: 0,
		selfRatedIntelligence: 5,
	});
	const [demoErrors, setDemoErrors] = useState<Partial<Record<keyof DemographicData, string>>>({});
	const startTimeRef = useRef<number>(Date.now());
	const topRef = useRef<HTMLDivElement>(null);

	// Elapsed timer
	const [elapsed, setElapsed] = useState(0);
	useEffect(() => {
		if (phase === 'intro' || phase === 'review') return;
		const interval = setInterval(() => {
			setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
		}, 1000);
		return () => clearInterval(interval);
	}, [phase]);

	// ── Helpers ──
	const getKey = (testType: string, itemNumber: number) => `${testType}-${itemNumber}`;

	const currentQuestions: QuestionConfig[] =
		phase === 'bfi' ? config.bfiQuestions : phase === 'sd3' ? config.sd3Questions : [];

	const totalPages = Math.ceil(currentQuestions.length / QUESTIONS_PER_PAGE);
	const pageQuestions = currentQuestions.slice(
		currentPage * QUESTIONS_PER_PAGE,
		(currentPage + 1) * QUESTIONS_PER_PAGE
	);

	const answeredOnPage = pageQuestions.filter(
		(q) => answers[getKey(q.testType, q.itemNumber)] !== undefined
	).length;

	const totalBfiAnswered = config.bfiQuestions.filter(
		(q) => answers[getKey(q.testType, q.itemNumber)] !== undefined
	).length;
	const totalSd3Answered = config.sd3Questions.filter(
		(q) => answers[getKey(q.testType, q.itemNumber)] !== undefined
	).length;
	const totalAnswered = totalBfiAnswered + totalSd3Answered;

	const allComplete = totalAnswered === config.totalQuestions;

	// ── Handlers ──
	const handleAnswer = useCallback((testType: string, itemNumber: number, value: number) => {
		setAnswers((prev) => ({ ...prev, [getKey(testType, itemNumber)]: value }));
	}, []);

	const scrollToTop = () => {
		topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	const nextPage = () => {
		if (currentPage < totalPages - 1) {
			setCurrentPage((p) => p + 1);
			scrollToTop();
		} else if (phase === 'bfi') {
			setPhase('transition');
			setCurrentPage(0);
			scrollToTop();
		} else if (phase === 'sd3') {
			setPhase('review');
			scrollToTop();
		}
	};

	const prevPage = () => {
		if (currentPage > 0) {
			setCurrentPage((p) => p - 1);
			scrollToTop();
		}
	};

	const handleSubmit = async () => {
		const responses: RawResponse[] = [];
		for (const q of [...config.bfiQuestions, ...config.sd3Questions]) {
			const value = answers[getKey(q.testType, q.itemNumber)];
			if (value !== undefined) {
				responses.push({
					testType: q.testType,
					itemNumber: q.itemNumber,
					value,
				});
			}
		}
		const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
		await onSubmit(demographics, responses, duration);
	};

	// ── Timer Display ──
	const formatTime = (seconds: number) => {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${String(s).padStart(2, '0')}`;
	};

	// ── Demographics Validation ──
	const validateDemographics = (): boolean => {
		const errors: Partial<Record<keyof DemographicData, string>> = {};
		if (!demographics.fullName.trim()) errors.fullName = 'Vui lòng nhập Họ và Tên';
		if (!demographics.university.trim()) errors.university = 'Vui lòng nhập Trường Đại học';
		if (demographics.studentYear < 1 || demographics.studentYear > 5)
			errors.studentYear = 'Vui lòng chọn năm học';
		if (demographics.cumulativeGpa < 0 || demographics.cumulativeGpa > 4)
			errors.cumulativeGpa = 'GPA phải từ 0.0 đến 4.0';
		if (demographics.selfRatedIntelligence < 1 || demographics.selfRatedIntelligence > 10)
			errors.selfRatedIntelligence = 'Vui lòng chọn từ 1 đến 10';
		setDemoErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleDemographicsNext = () => {
		if (validateDemographics()) {
			setPhase('bfi');
			scrollToTop();
		}
	};

	// ── Progress Bar ──
	const progressPercent = config.totalQuestions > 0
		? Math.round((totalAnswered / config.totalQuestions) * 100)
		: 0;

	return (
		<div ref={topRef} className="mx-auto max-w-3xl">
			{/* ── Progress Header ── */}
			{phase !== 'intro' && (
				<div className="sticky top-0 z-10 mb-6 rounded-2xl border border-border bg-surface/95 p-4 backdrop-blur-md">
					<div className="flex items-center justify-between text-sm">
						<span className="font-bold text-foreground">
							{phase === 'demographics' && '📝 Thông tin cá nhân'}
							{phase === 'bfi' && '🌟 Phần 1: BFI-2-S (OCEAN)'}
							{phase === 'sd3' && '🌑 Phần 2: Dark Triad (SD3)'}
							{phase === 'transition' && '⚡ Chuyển sang phần 2'}
							{phase === 'review' && '📋 Xem lại & Gửi kết quả'}
						</span>
						<div className="flex items-center gap-3">
							<span className="text-xs text-muted tabular-nums">⏱ {formatTime(elapsed)}</span>
							<span className="text-xs font-bold text-accent tabular-nums">
								{totalAnswered}/{config.totalQuestions}
							</span>
						</div>
					</div>
					<div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background-secondary">
						<motion.div
							className="h-full rounded-full bg-accent"
							initial={{ width: 0 }}
							animate={{ width: `${progressPercent}%` }}
							transition={{ duration: 0.3 }}
						/>
					</div>
				</div>
			)}

			<AnimatePresence mode="wait">
				{/* ════ INTRO PHASE ════ */}
				{phase === 'intro' && (
					<motion.div
						key="intro"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						className="space-y-8"
					>
						<div className="rounded-2xl border border-border bg-surface p-8 sm:p-10">
							<div className="text-center">
								<div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-subtle text-3xl">
									🧠
								</div>
								<h2 className="mt-5 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
									Dual Personality Assessment
								</h2>
								<p className="mt-3 text-sm leading-relaxed text-muted max-w-lg mx-auto">
									Bài đánh giá kết hợp hai mô hình tâm lý học nổi tiếng để phân tích sâu tính cách của bạn
									trong bối cảnh tổ chức và nghề nghiệp.
								</p>
							</div>

							<div className="mt-8 grid gap-4 sm:grid-cols-2">
								<div className="rounded-xl border border-border bg-background p-5">
									<div className="flex items-center gap-3">
										<span className="text-2xl">🌟</span>
										<div>
											<h3 className="font-bold text-foreground">BFI-2-S</h3>
											<p className="text-xs text-muted">Big Five Inventory — 30 câu</p>
										</div>
									</div>
									<p className="mt-3 text-xs leading-relaxed text-muted">
										Đánh giá 5 chiều tính cách lớn: Hướng ngoại, Dễ chịu, Tận tâm,
										Cảm xúc tiêu cực, và Cởi mở.
									</p>
								</div>

								<div className="rounded-xl border border-border bg-background p-5">
									<div className="flex items-center gap-3">
										<span className="text-2xl">🌑</span>
										<div>
											<h3 className="font-bold text-foreground">Dark Triad (SD3)</h3>
											<p className="text-xs text-muted">Short Dark Triad — 27 câu</p>
										</div>
									</div>
									<p className="mt-3 text-xs leading-relaxed text-muted">
										Đo lường 3 đặc điểm &quot;bóng tối&quot;: Mưu lược, Tự ái, và Phản xã hội.
									</p>
								</div>
							</div>

							<div className="mt-6 rounded-xl bg-warning-subtle p-4">
								<p className="text-xs leading-relaxed text-foreground-secondary">
									<span className="font-bold">⚠ Lưu ý:</span> Bài test có {config.totalQuestions} câu hỏi, mất khoảng 10-15 phút.
									Trả lời thành thật — không có câu trả lời đúng hay sai. Bài test có câu hỏi kiểm tra
									sự chú ý — hãy đọc kĩ mỗi câu.
								</p>
							</div>

							<button
								onClick={() => {
									setPhase('demographics');
									startTimeRef.current = Date.now();
								}}
								className="mt-6 w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
							>
								Bắt đầu bài đánh giá →
							</button>
						</div>
					</motion.div>
				)}

				{/* ════ DEMOGRAPHICS PHASE ════ */}
				{phase === 'demographics' && (
					<motion.div
						key="demographics"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						className="space-y-6"
					>
						<div className="rounded-2xl border border-border bg-surface p-8 sm:p-10">
							<div className="text-center mb-8">
								<div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-subtle text-2xl">
									📝
								</div>
								<h2 className="mt-4 text-xl font-black tracking-tight text-foreground sm:text-2xl">
									Thông tin cá nhân
								</h2>
								<p className="mt-2 text-sm text-muted max-w-md mx-auto">
									Vui lòng điền các thông tin bên dưới trước khi bắt đầu bài đánh giá.
									Thông tin này được sử dụng cho mục đích nghiên cứu.
								</p>
							</div>

							<div className="space-y-5 max-w-md mx-auto">
								{/* Full Name */}
								<div>
									<label className="block text-sm font-bold text-foreground mb-1.5">
										Họ và Tên <span className="text-error">*</span>
									</label>
									<input
										type="text"
										value={demographics.fullName}
										onChange={(e) => setDemographics((d) => ({ ...d, fullName: e.target.value }))}
										placeholder="Nguyễn Văn A"
										className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
									/>
									{demoErrors.fullName && (
										<p className="mt-1 text-xs text-error">{demoErrors.fullName}</p>
									)}
								</div>

								{/* University */}
								<div>
									<label className="block text-sm font-bold text-foreground mb-1.5">
										Trường Đại học <span className="text-error">*</span>
									</label>
									<input
										type="text"
										value={demographics.university}
										onChange={(e) => setDemographics((d) => ({ ...d, university: e.target.value }))}
										placeholder="Đại học Kinh tế TP.HCM"
										className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
									/>
									{demoErrors.university && (
										<p className="mt-1 text-xs text-error">{demoErrors.university}</p>
									)}
								</div>

								{/* Student Year */}
								<div>
									<label className="block text-sm font-bold text-foreground mb-1.5">
										Sinh viên năm mấy? <span className="text-error">*</span>
									</label>
									<div className="flex gap-2">
										{STUDENT_YEAR_OPTIONS.map((opt) => (
											<button
												key={opt.value}
												type="button"
												onClick={() => setDemographics((d) => ({ ...d, studentYear: opt.value }))}
												className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-bold transition-all ${
													demographics.studentYear === opt.value
														? 'border-accent bg-accent text-accent-foreground'
														: 'border-border bg-background text-muted hover:border-border-hover'
												}`}
											>
												{opt.label}
											</button>
										))}
									</div>
									{demoErrors.studentYear && (
										<p className="mt-1 text-xs text-error">{demoErrors.studentYear}</p>
									)}
								</div>

								{/* Cumulative GPA */}
								<div>
									<label className="block text-sm font-bold text-foreground mb-1.5">
										Điểm GPA tích lũy (thang 4.0) <span className="text-error">*</span>
									</label>
									<input
										type="number"
										min={0}
										max={4}
										step={0.01}
										value={demographics.cumulativeGpa || ''}
										onChange={(e) =>
											setDemographics((d) => ({
												...d,
												cumulativeGpa: parseFloat(e.target.value) || 0,
											}))
										}
										placeholder="3.25"
										className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
									/>
									{demoErrors.cumulativeGpa && (
										<p className="mt-1 text-xs text-error">{demoErrors.cumulativeGpa}</p>
									)}
								</div>

								{/* Self-Rated Intelligence */}
								<div>
									<label className="block text-sm font-bold text-foreground mb-1.5">
										Bạn tự đánh giá trí thông minh của mình (1-10) <span className="text-error">*</span>
									</label>
									<div className="flex items-center gap-3">
										<span className="text-xs text-muted whitespace-nowrap">Thấp 1</span>
										<input
											type="range"
											min={1}
											max={10}
											step={1}
											value={demographics.selfRatedIntelligence}
											onChange={(e) =>
												setDemographics((d) => ({
													...d,
													selfRatedIntelligence: parseInt(e.target.value),
												}))
											}
											className="flex-1 accent-accent"
										/>
										<span className="text-xs text-muted whitespace-nowrap">10 Cao</span>
									</div>
									<div className="mt-1 text-center">
										<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">
											{demographics.selfRatedIntelligence}
										</span>
									</div>
									{demoErrors.selfRatedIntelligence && (
										<p className="mt-1 text-xs text-error">{demoErrors.selfRatedIntelligence}</p>
									)}
								</div>
							</div>

							<button
								onClick={handleDemographicsNext}
								className="mt-8 w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
							>
								Tiếp tục đến câu hỏi →
							</button>
						</div>
					</motion.div>
				)}

				{/* ════ QUESTION PHASE (BFI or SD3) ════ */}
				{(phase === 'bfi' || phase === 'sd3') && (
					<motion.div
						key={`questions-${phase}-${currentPage}`}
						initial={{ opacity: 0, x: 30 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -30 }}
						transition={{ duration: 0.2 }}
						className="space-y-4"
					>
						{pageQuestions.map((q, idx) => {
							const key = getKey(q.testType, q.itemNumber);
							const selected = answers[key];
							const globalIndex =
								(phase === 'bfi' ? 0 : config.bfiQuestions.length) +
								currentPage * QUESTIONS_PER_PAGE +
								idx +
								1;

							return (
								<div
									key={key}
									className={`rounded-xl border p-5 sm:p-6 transition-all duration-200 ${
										selected !== undefined
											? 'border-accent/30 bg-accent-subtle/50'
											: 'border-border bg-surface'
									}`}
								>
									{/* Question header */}
									<div className="flex items-start gap-3">
										<span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background-secondary text-xs font-bold text-muted">
											{globalIndex}
										</span>
										<div className="flex-1">
											<p className="text-sm font-semibold leading-relaxed text-foreground">
												{q.textVi}
											</p>
											<p className="mt-1 text-xs italic text-muted leading-relaxed">
												{q.text}
											</p>
										</div>
									</div>

									{/* Likert scale */}
									<div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
										{LIKERT_OPTIONS.map((opt) => (
											<button
												key={opt.value}
												onClick={() => handleAnswer(q.testType, q.itemNumber, opt.value)}
												className={`group relative flex-1 min-w-14 rounded-lg border px-2 py-2.5 text-center transition-all duration-150 ${
													selected === opt.value
														? 'border-accent bg-accent text-accent-foreground shadow-md scale-[1.02]'
														: 'border-border bg-background text-muted hover:border-border-hover hover:bg-surface-hover'
												}`}
											>
												<span className="block text-sm font-bold">{opt.value}</span>
												<span className="mt-0.5 hidden text-[10px] leading-tight opacity-70 sm:block">
													{opt.label}
												</span>
											</button>
										))}
									</div>
								</div>
							);
						})}

						{/* Navigation */}
						<div className="flex items-center justify-between pt-2">
							<button
								onClick={prevPage}
								disabled={currentPage === 0}
								className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed"
							>
								← Trước
							</button>

							<span className="text-xs text-muted tabular-nums">
								Trang {currentPage + 1} / {totalPages}
							</span>

							<button
								onClick={nextPage}
								disabled={answeredOnPage < pageQuestions.length}
								className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
							>
								{currentPage === totalPages - 1
									? phase === 'bfi'
										? 'Sang phần 2 →'
										: 'Xem lại →'
									: 'Tiếp →'}
							</button>
						</div>
					</motion.div>
				)}

				{/* ════ TRANSITION PHASE ════ */}
				{phase === 'transition' && (
					<motion.div
						key="transition"
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						className="rounded-2xl border border-border bg-surface p-8 text-center sm:p-10"
					>
						<div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-subtle text-3xl">
							🌑
						</div>
						<h3 className="mt-5 text-xl font-black text-foreground">
							Phần 2: The Dark Triad
						</h3>
						<p className="mt-3 text-sm text-muted leading-relaxed max-w-md mx-auto">
							Phần tiếp theo khám phá các khía cạnh &quot;bóng tối&quot; của tính cách — Mưu lược,
							Tự ái, và Phản xã hội. Không có câu trả lời đúng sai — hãy tiếp tục trả lời thành thật.
						</p>
						<div className="mt-4 text-xs text-muted">
							✅ Đã hoàn thành: {totalBfiAnswered}/30 câu BFI-2-S
						</div>
						<button
							onClick={() => {
								setPhase('sd3');
								setCurrentPage(0);
							}}
							className="mt-6 rounded-xl bg-accent px-8 py-3.5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
						>
							Tiếp tục →
						</button>
					</motion.div>
				)}

				{/* ════ REVIEW PHASE ════ */}
				{phase === 'review' && (
					<motion.div
						key="review"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						className="space-y-6"
					>
						<div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
							<h3 className="text-lg font-black text-foreground">📋 Xem lại kết quả</h3>
							<p className="mt-2 text-sm text-muted">
								Kiểm tra lại trước khi gửi. Sau khi gửi sẽ không thể thay đổi.
							</p>

							<div className="mt-5 grid gap-3 sm:grid-cols-2">
								<div className="rounded-xl border border-border bg-background p-4">
									<div className="flex items-center justify-between">
										<span className="text-sm font-bold text-foreground">🌟 BFI-2-S</span>
										<span className={`text-xs font-bold ${totalBfiAnswered === 30 ? 'text-success' : 'text-error'}`}>
											{totalBfiAnswered}/30
										</span>
									</div>
								</div>
								<div className="rounded-xl border border-border bg-background p-4">
									<div className="flex items-center justify-between">
										<span className="text-sm font-bold text-foreground">🌑 SD3</span>
										<span className={`text-xs font-bold ${totalSd3Answered === 27 ? 'text-success' : 'text-error'}`}>
											{totalSd3Answered}/27
										</span>
									</div>
								</div>
							</div>

							<div className="mt-4 text-xs text-muted">
								Thời gian: {formatTime(elapsed)}
							</div>

							<div className="mt-6 flex flex-col gap-3 sm:flex-row">
								<button
									onClick={() => {
										setPhase('bfi');
										setCurrentPage(0);
									}}
									className="flex-1 rounded-xl border border-border bg-background py-3 text-sm font-bold text-foreground transition-colors hover:bg-surface-hover"
								>
									← Xem lại câu hỏi
								</button>
								<button
									onClick={handleSubmit}
									disabled={!allComplete || isSubmitting}
									className="flex-1 rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
								>
									{isSubmitting ? (
										<span className="inline-flex items-center gap-2">
											<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
											</svg>
											Đang phân tích...
										</span>
									) : (
										'Gửi kết quả & Phân tích 🚀'
									)}
								</button>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
