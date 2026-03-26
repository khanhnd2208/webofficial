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
const STORAGE_KEY = 'personality-test-progress';

const LIKERT_OPTIONS = [
	{ value: 1, label: 'Rất không đồng ý', labelEn: 'Strongly Disagree' },
	{ value: 2, label: 'Không đồng ý',     labelEn: 'Disagree' },
	{ value: 3, label: 'Trung lập',         labelEn: 'Neutral' },
	{ value: 4, label: 'Đồng ý',            labelEn: 'Agree' },
	{ value: 5, label: 'Rất đồng ý',        labelEn: 'Strongly Agree' },
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
		gender: 'male',
		university: '',
		studentYear: 1,
		cumulativeGpa: 0,
		selfRatedIntelligence: 5,
	});
	const [demoErrors, setDemoErrors] = useState<Partial<Record<keyof DemographicData, string>>>({});
	const startTimeRef = useRef<number>(Date.now());
	const topRef = useRef<HTMLDivElement>(null);
	const [restored, setRestored] = useState(false);

	// Saved progress data (loaded once, applied when user clicks "resume")
	const savedProgressRef = useRef<{ phase: TestPhase; currentPage: number; startTime: number } | null>(null);

	// ── Restore from localStorage on mount ──
	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const data = JSON.parse(saved);
				if (data.answers && Object.keys(data.answers).length > 0) {
					setAnswers(data.answers);
					// Save the navigation state for "resume" button
					savedProgressRef.current = {
						phase: data.phase || 'demographics',
						currentPage: data.currentPage || 0,
						startTime: data.startTime || Date.now(),
					};
				}
				if (data.demographics) {
					setDemographics(data.demographics);
				}
				// Don't auto-navigate — stay on intro so user can choose to resume or restart
			}
		} catch {}
		setRestored(true);
	}, []);

	// ── Persist to localStorage on every meaningful change ──
	useEffect(() => {
		if (!restored) return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({
				answers,
				demographics,
				phase,
				currentPage,
				startTime: startTimeRef.current,
				savedAt: Date.now(),
			}));
		} catch {}
	}, [answers, demographics, phase, currentPage, restored]);

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
							{phase === 'demographics' && '👤 Một chút về bạn'}
							{phase === 'bfi' && '🌟 Phần 1: Tính cách lớn'}
							{phase === 'sd3' && '🌑 Phần 2: Bản năng xã hội'}
							{phase === 'transition' && '🎉 Tuyệt vời!'}
							{phase === 'review' && '🎊 Gần xong rồi!'}
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
									🪞
								</div>
								<h2 className="mt-5 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
									Khám phá bản thân bạn
								</h2>
								<p className="mt-3 text-sm leading-relaxed text-muted max-w-lg mx-auto">
									Bài đánh giá này giúp bạn hiểu rõ hơn về tính cách của mình — điểm mạnh, điểm cần lưu ý, và
									những gợi ý hữu ích cho hành trình phát triển bản thân và nghề nghiệp.
								</p>
							</div>

							<div className="mt-8 grid gap-4 sm:grid-cols-2">
								<div className="rounded-xl border border-indigo/20 bg-indigo-subtle/30 p-5">
									<div className="flex items-center gap-3">
										<span className="text-2xl">🌟</span>
										<div>
											<h3 className="font-bold text-foreground">Phần 1 — Tính cách lớn</h3>
											<p className="text-xs text-muted">30 câu • BFI-2-S (Big Five)</p>
										</div>
									</div>
									<p className="mt-3 text-xs leading-relaxed text-muted">
										Khám phá 5 nét tính cách nền tảng: Hướng ngoại, Dễ chịu, Tận tâm,
										Độ nhạy cảm, và Sẵn sàng trải nghiệm.
									</p>
								</div>

								<div className="rounded-xl border border-rose/20 bg-rose-subtle/30 p-5">
									<div className="flex items-center gap-3">
										<span className="text-2xl">🌑</span>
										<div>
											<h3 className="font-bold text-foreground">Phần 2 — Bản năng xã hội</h3>
											<p className="text-xs text-muted">27 câu • SD3 (Short Dark Triad)</p>
										</div>
									</div>
									<p className="mt-3 text-xs leading-relaxed text-muted">
										Tìm hiểu 3 khía cạnh mà ít ai nhìn thấy: Tư duy chiến lược, Sự tự tin, và
										Khả năng chấp nhận rủi ro.
									</p>
								</div>
							</div>

							<div className="mt-6 rounded-xl bg-accent-subtle/40 border border-accent/15 p-4">
								<div className="flex items-start gap-2.5">
									<span className="text-base mt-0.5">💡</span>
									<div className="text-xs leading-relaxed text-foreground-secondary">
										<p className="font-bold text-foreground">Trước khi bắt đầu:</p>
										<ul className="mt-1.5 space-y-1 text-muted">
											<li>• <strong>{config.totalQuestions} câu</strong>, mất khoảng 10-15 phút</li>
											<li>• Không có câu trả lời đúng hay sai — hãy chọn theo cảm nhận thật của bạn</li>
											<li>• Hãy đọc kĩ mỗi câu — có một vài câu kiểm tra sự tập trung 😉</li>
										</ul>
									</div>
								</div>
							</div>

							<button
								onClick={() => {
									setPhase('demographics');
									startTimeRef.current = Date.now();
								}}
								className="mt-6 w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-accent-foreground transition-all hover:bg-accent-hover hover:scale-[1.01] active:scale-[0.99]"
							>
								Bắt đầu khám phá 🚀
							</button>

							{/* Resume button if saved progress exists */}
							{restored && Object.keys(answers).length > 0 && (
								<div className="mt-3 rounded-xl border border-accent/30 bg-accent-subtle/30 p-4 text-center">
									<p className="text-xs text-muted mb-2">
										👋 Chào bạn quay lại! Bạn đã trả lời {Object.keys(answers).length}/{config.totalQuestions} câu
									</p>
									<div className="flex gap-2 justify-center">
										<button
											onClick={() => {
												const sp = savedProgressRef.current;
												if (sp) {
													setPhase(sp.phase);
													setCurrentPage(sp.currentPage);
													startTimeRef.current = sp.startTime;
												} else {
													setPhase('demographics');
													startTimeRef.current = Date.now();
												}
											}}
											className="rounded-lg bg-accent px-4 py-2 text-xs font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
										>
											Tiếp tục bài đang làm →
										</button>
										<button
											onClick={() => {
												setAnswers({});
												setDemographics({
													fullName: '',
													gender: 'male',
													university: '',
													studentYear: 1,
													cumulativeGpa: 0,
													selfRatedIntelligence: 5,
												});
												setPhase('demographics');
												setCurrentPage(0);
												startTimeRef.current = Date.now();
												savedProgressRef.current = null;
												try { localStorage.removeItem(STORAGE_KEY); } catch {}
											}}
											className="rounded-lg border border-border px-4 py-2 text-xs font-bold text-muted transition-colors hover:text-foreground hover:bg-surface-hover"
										>
											Làm mới từ đầu
										</button>
									</div>
								</div>
							)}
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
									👤
								</div>
								<h2 className="mt-4 text-xl font-black tracking-tight text-foreground sm:text-2xl">
									Một chút về bạn
								</h2>
								<p className="mt-2 text-sm text-muted max-w-md mx-auto">
									Thông tin này giúp so sánh kết quả của bạn với nhóm cùng bối cảnh
									và phục vụ mục đích nghiên cứu học thuật.
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

								{/* Gender */}
								<div>
									<label className="block text-sm font-bold text-foreground mb-1.5">
										Giới tính <span className="text-error">*</span>
									</label>
									<div className="flex gap-2">
										{([{ value: 'male' as const, label: '👨 Nam' }, { value: 'female' as const, label: '👩 Nữ' }, { value: 'other' as const, label: '🧑 Khác' }]).map((opt) => (
											<button
												key={opt.value}
												type="button"
												onClick={() => setDemographics((d) => ({ ...d, gender: opt.value }))}
												className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-bold transition-all ${
													demographics.gender === opt.value
														? 'border-accent bg-accent text-accent-foreground'
														: 'border-border bg-background text-muted hover:border-border-hover'
												}`}
											>
												{opt.label}
											</button>
										))}
									</div>
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
										<label className="block text-sm font-bold text-foreground mb-1">
											Bạn cảm thấy mình thông minh ở mức nào? <span className="text-error">*</span>
										</label>
										<p className="text-[11px] text-muted mb-1.5">Không có đáp án đúng sai — hãy chọn theo cảm nhận thật của bạn</p>
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
								className="mt-8 w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-accent-foreground transition-all hover:bg-accent-hover hover:scale-[1.01] active:scale-[0.99]"
							>
								Xong rồi — Bắt đầu trả lời nào! 🎯
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
											{/* Vietnamese — primary label for Vietnamese students */}
											<p className="text-sm font-bold leading-snug text-foreground">
												{q.textVi}
											</p>
											{/* English — secondary reference */}
											<p className="mt-1 text-[11px] leading-relaxed text-muted">
												{q.text}
											</p>
										</div>
									</div>

									{/* Likert scale */}
								<div className="mt-4 flex gap-1.5 sm:gap-2">
									{LIKERT_OPTIONS.map((opt) => (
										<button
											key={opt.value}
											onClick={() => handleAnswer(q.testType, q.itemNumber, opt.value)}
											title={`${opt.label} (${opt.labelEn})`}
											className={`group flex flex-1 flex-col items-center gap-0.5 rounded-xl border-2 px-1 py-2.5 text-center transition-all duration-150 ${
												selected === opt.value
													? 'border-accent bg-accent text-white dark:text-[#121110] shadow-md scale-[1.04] font-black'
													: 'border-border bg-surface text-foreground-secondary hover:border-accent/60 hover:bg-accent-subtle hover:text-foreground'
											}`}
										>
											<span className="text-base font-black leading-none tabular-nums">{opt.value}</span>
											<span className={`text-[8px] sm:text-[9px] font-bold leading-tight mt-0.5 ${
												selected === opt.value ? 'opacity-90' : 'opacity-50'
											}`}>
												{opt.label.split(' ').map((w, i) => <span key={i} className="block">{w}</span>)}
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
						className="rounded-2xl border border-border bg-surface p-8 sm:p-10"
					>
						<div className="text-center">
							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ type: 'spring', stiffness: 260, damping: 20 }}
								className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-success-subtle text-3xl"
							>
								🎉
							</motion.div>
							<h3 className="mt-5 text-xl font-black text-foreground">
								Tuyệt vời! Phần 1 hoàn thành
							</h3>
							<p className="mt-1 text-sm font-semibold text-success">
								✅ {totalBfiAnswered}/30 câu — đã xong phần Tính cách lớn (OCEAN)
							</p>
						</div>

						<div className="mt-6 rounded-xl border border-rose/20 bg-rose-subtle/30 p-5">
							<div className="flex items-center gap-3">
								<span className="text-2xl">🌑</span>
								<div>
									<h4 className="font-bold text-foreground">Tiếp theo: Bản năng xã hội</h4>
									<p className="text-xs text-muted">27 câu • SD3 (Short Dark Triad)</p>
								</div>
							</div>
							<p className="mt-3 text-xs leading-relaxed text-muted">
								Phần này tìm hiểu về tư duy chiến lược, sự tự tin, và khả năng chấp nhận rủi ro.
								Không có câu trả lời đúng sai — hãy tiếp tục trả lời theo cảm nhận thật nhé!
							</p>
						</div>

						<div className="mt-4 text-center">
							<p className="text-xs text-muted mb-4">Còn {config.sd3Questions.length} câu nữa — khoảng 5 phút thôi 💪</p>
							<button
								onClick={() => {
									setPhase('sd3');
									setCurrentPage(0);
								}}
								className="rounded-xl bg-accent px-8 py-3.5 text-sm font-bold text-accent-foreground transition-all hover:bg-accent-hover hover:scale-[1.01] active:scale-[0.99]"
							>
								Sẵn sàng — Tiếp tục nào! →
							</button>
						</div>
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
							<div className="text-center">
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{ type: 'spring', stiffness: 260, damping: 20 }}
									className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-success-subtle text-2xl"
								>
									🎊
								</motion.div>
								<h3 className="mt-4 text-lg font-black text-foreground">Bạn đã hoàn thành tất cả!</h3>
								<p className="mt-1 text-sm text-muted">
									Cảm ơn bạn đã dành thời gian. Hãy kiểm tra lại trước khi gửi nhé.
								</p>
							</div>

							<div className="mt-5 grid gap-3 sm:grid-cols-2">
								<div className="rounded-xl border border-indigo/20 bg-indigo-subtle/30 p-4">
									<div className="flex items-center justify-between">
										<span className="text-sm font-bold text-foreground">🌟 Tính cách lớn</span>
										<span className={`text-xs font-bold ${totalBfiAnswered === 30 ? 'text-success' : 'text-error'}`}>
											{totalBfiAnswered}/30 ✅
										</span>
									</div>
									<p className="mt-1 text-[10px] text-muted">BFI-2-S — Big Five Inventory</p>
								</div>
								<div className="rounded-xl border border-rose/20 bg-rose-subtle/30 p-4">
									<div className="flex items-center justify-between">
										<span className="text-sm font-bold text-foreground">🌑 Bản năng xã hội</span>
										<span className={`text-xs font-bold ${totalSd3Answered === 27 ? 'text-success' : 'text-error'}`}>
											{totalSd3Answered}/27 ✅
										</span>
									</div>
									<p className="mt-1 text-[10px] text-muted">SD3 — Short Dark Triad</p>
								</div>
							</div>

							<div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted">
								<span>⏱ {formatTime(elapsed)}</span>
								<span>•</span>
								<span>{totalAnswered}/{config.totalQuestions} câu</span>
							</div>

							{!allComplete && (
								<div className="rounded-lg bg-warning-subtle p-3 text-center">
									<p className="text-xs font-bold text-warning">⚠ Bạn chưa trả lời hết — hãy quay lại kiểm tra nhé</p>
								</div>
							)}

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
									className="flex-1 rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground transition-all hover:bg-accent-hover hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
								>
									{isSubmitting ? (
										<span className="inline-flex items-center gap-2">
											<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
											</svg>
											Đang phân tích tính cách của bạn...
										</span>
									) : (
										'Xem kết quả của tôi 🚀'
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
