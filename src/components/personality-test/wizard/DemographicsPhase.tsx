'use client';

/* ════════════════════════════════════════════════════════════════════════
   DemographicsPhase — Collect demographic data (gender, university, etc.)
   ════════════════════════════════════════════════════════════════════════ */

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { DemographicData } from '@/types/personalityTest';
import type { DemographicsPhaseProps } from './types';
import {
	UNIVERSITY_OPTIONS,
	STUDENT_YEAR_OPTIONS,
	GPA_OPTIONS,
	INTELLIGENCE_OPTIONS,
} from './constants';

export default function DemographicsPhase({
	demographics,
	setDemographics,
	onNext,
}: DemographicsPhaseProps) {
	const [universityMode, setUniversityMode] = useState<'hanoi' | 'other'>(
		demographics.university === 'Trường Đại học Hà Nội' ? 'hanoi' : 'other'
	);
	const [studentYearMode, setStudentYearMode] = useState<1 | 2 | 3 | 4 | 5>(
		demographics.studentYear >= 1 && demographics.studentYear <= 4
			? (demographics.studentYear as 1 | 2 | 3 | 4)
			: 5
	);
	const [studentYearOther, setStudentYearOther] = useState('');
	const [demoErrors, setDemoErrors] = useState<Partial<Record<keyof DemographicData, string>>>({});

	const validateDemographics = (): boolean => {
		const errors: Partial<Record<keyof DemographicData, string>> = {};
		if (!demographics.university.trim()) errors.university = 'Please enter your university';
		if (demographics.studentYear < 1 || demographics.studentYear > 5)
			errors.studentYear = 'Please select a student year';
		if (demographics.cumulativeGpa < 0 || demographics.cumulativeGpa > 4)
			errors.cumulativeGpa = 'GPA must be between 0.0 and 4.0';
		if (demographics.selfRatedIntelligence < 1 || demographics.selfRatedIntelligence > 9)
			errors.selfRatedIntelligence = 'Please select a value from 1 to 9';
		setDemoErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleNext = () => {
		if (validateDemographics()) {
			onNext();
		}
	};

	return (
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
						About You
					</h2>
					<p className="mt-2 text-sm text-muted max-w-md mx-auto">
						This information helps compare your results with similar reference groups
						and serves academic research purposes.
					</p>
				</div>

				<div className="space-y-6 max-w-xl mx-auto">
					{/* Gender */}
					<div>
						<label className="block text-sm font-bold text-foreground mb-1.5">
							Gender <span className="text-error">*</span>
						</label>
						<div className="flex gap-2">
							{([
								{ value: 'male' as const, label: '👨 Male' },
								{ value: 'female' as const, label: '👩 Female' },
								{ value: 'other' as const, label: '🧑 Other' },
							]).map((opt) => (
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
						<label className="block text-sm font-bold text-foreground mb-2">
							Trường <span className="text-error">*</span>
						</label>
						<div className="space-y-3">
							{UNIVERSITY_OPTIONS.map((opt) => (
								<label key={opt.value} className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
									<input
										type="radio"
										name="university"
										checked={universityMode === opt.value}
										onChange={() => {
											setUniversityMode(opt.value);
											if (opt.value === 'hanoi') {
												setDemographics((d) => ({ ...d, university: opt.text }));
											} else {
												setDemographics((d) => ({ ...d, university: '' }));
											}
										}}
										className="h-4 w-4"
									/>
									<span className="font-medium">{opt.label}</span>
								</label>
							))}
							{universityMode === 'other' && (
								<div className="pl-7">
									<input
										type="text"
										value={demographics.university}
										onChange={(e) => setDemographics((d) => ({ ...d, university: e.target.value }))}
										placeholder="Other university"
										className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
									/>
								</div>
							)}
						</div>
						{demoErrors.university && (
							<p className="mt-1 text-xs text-error">{demoErrors.university}</p>
						)}
					</div>

					{/* Student Year */}
					<div>
						<label className="block text-sm font-bold text-foreground mb-1.5">
							Bạn là sinh viên năm mấy của Trường? <span className="text-error">*</span>
						</label>
						<div className="space-y-3">
							{STUDENT_YEAR_OPTIONS.map((opt) => (
								<label
									key={opt.value}
									className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
								>
									<input
										type="radio"
										name="studentYear"
										checked={studentYearMode === opt.value}
										onChange={() => {
											setStudentYearMode(opt.value);
											setDemographics((d) => ({ ...d, studentYear: opt.value }));
											if (opt.value !== 5) setStudentYearOther('');
										}}
										className="h-4 w-4"
									/>
									<span className="font-medium">{opt.label}</span>
								</label>
							))}
							{studentYearMode === 5 && (
								<div className="pl-7">
									<input
										type="text"
										value={studentYearOther}
										onChange={(e) => {
											setStudentYearOther(e.target.value);
											const parsed = Number.parseInt(e.target.value, 10);
											if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 5) {
												setDemographics((d) => ({ ...d, studentYear: parsed }));
											}
										}}
										placeholder="Other"
										className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
									/>
								</div>
							)}
						</div>
						{demoErrors.studentYear && (
							<p className="mt-1 text-xs text-error">{demoErrors.studentYear}</p>
						)}
					</div>

					{/* Cumulative GPA */}
					<div>
						<label className="block text-sm font-bold text-foreground mb-1.5">
							GPA tích luỹ đến thời điểm hiện tại của bạn <span className="text-error">*</span>
						</label>
						<div className="space-y-3">
							{GPA_OPTIONS.map((opt) => (
								<label key={opt.label} className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
									<input
										type="radio"
										name="gpa"
										checked={demographics.cumulativeGpa === opt.value}
										onChange={() => setDemographics((d) => ({ ...d, cumulativeGpa: opt.value }))}
										className="h-4 w-4"
									/>
									<span className="font-medium">{opt.label}</span>
								</label>
							))}
						</div>
						{demoErrors.cumulativeGpa && (
							<p className="mt-1 text-xs text-error">{demoErrors.cumulativeGpa}</p>
						)}
					</div>

					{/* Self-Rated Intelligence */}
					<div>
						<label className="block text-sm font-bold text-foreground mb-1.5">
							How would you rate your level of general intelligence compared to that of the average student? <span className="text-error">*</span>
						</label>
						<p className="text-[11px] text-muted mb-3">Circle a number on the following scale:</p>
						<div className="space-y-2 rounded-2xl border border-border bg-background p-4">
							{INTELLIGENCE_OPTIONS.map((opt) => (
								<label key={opt.value} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted/40">
									<input
										type="radio"
										name="intelligence"
										checked={demographics.selfRatedIntelligence === opt.value}
										onChange={() => setDemographics((d) => ({ ...d, selfRatedIntelligence: opt.value }))}
										className="h-4 w-4"
									/>
									<div className="flex flex-1 items-center justify-between gap-3">
										<span className="w-4 text-sm font-bold text-foreground">{opt.label}</span>
										<span className="flex-1 border-b border-dotted border-border/70" />
										<span className="text-xs text-muted text-right">{opt.subtitle}</span>
									</div>
								</label>
							))}
						</div>
						{demoErrors.selfRatedIntelligence && (
							<p className="mt-1 text-xs text-error">{demoErrors.selfRatedIntelligence}</p>
						)}
					</div>
				</div>

				<button
					onClick={handleNext}
					className="mt-8 w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-accent-foreground transition-all hover:bg-accent-hover hover:scale-[1.01] active:scale-[0.99]"
				>
					Done — Let&apos;s start! 🎯
				</button>
			</div>
		</motion.div>
	);
}
