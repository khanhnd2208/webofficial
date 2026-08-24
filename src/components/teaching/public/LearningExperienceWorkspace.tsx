'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent } from 'react';

import { teachingApi } from '@/components/teaching/admin/api';
import { Dialog } from '@/components/ui/Dialog';
import type {
	LearningExperienceChoice,
	LearningExperienceSession,
} from '@/features/teaching/types';

import styles from './LearningExperienceWorkspace.module.css';

const EXPERIENCE_IMAGES = {
	CHALLENGE: '/brand/teaching/teach-you-a-lesson.png',
	SUPPORT: '/brand/teaching/prince-princess-treatment.png',
} satisfies Record<LearningExperienceChoice, string>;

type StudentLoginOption = {
	enrollmentId: string;
	studentCode: string;
	fullName: string;
	hasDateOfBirth: boolean;
};

function normalizeSearch(value: string) {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.trim();
}

const experiences: Array<{
	choice: LearningExperienceChoice;
	mode: string;
	title: string;
	subtitle: string;
	action: string;
	features: Array<{ icon: string; label: string }>;
}> = [
	{
		choice: 'CHALLENGE',
		mode: 'Challenge mode',
		title: 'Teach me a lesson',
		subtitle: 'Học qua tiêu chuẩn cao, kỷ luật và những thử thách đủ khó để bạn bứt phá.',
		action: 'Chọn thử thách',
		features: [
			{ icon: 'track_changes', label: 'Kỳ vọng cao' },
			{ icon: 'shield', label: 'Kỷ luật' },
			{ icon: 'trending_up', label: 'Động lực mạnh' },
			{ icon: 'gavel', label: 'Hệ quả rõ ràng' },
		],
	},
	{
		choice: 'SUPPORT',
		mode: 'Royal support mode',
		title: 'Prince / Princess treatment',
		subtitle: 'Học trong môi trường hỗ trợ, tôn trọng và truyền cảm hứng để bạn tiến bộ bền vững.',
		action: 'Chọn hỗ trợ',
		features: [
			{ icon: 'record_voice_over', label: 'Coaching tận tâm' },
			{ icon: 'chair', label: 'Học thoải mái' },
			{ icon: 'favorite', label: 'Khích lệ tích cực' },
			{ icon: 'forum', label: 'Feedback liên tục' },
		],
	},
];

function resetTilt(element: HTMLElement) {
	element.style.setProperty('--learning-rx', '0deg');
	element.style.setProperty('--learning-ry', '0deg');
}

export function LearningExperienceWorkspace({
	slug,
	courseName,
	students,
}: {
	slug: string;
	courseName: string;
	students: StudentLoginOption[];
}) {
	const endpoint = `/api/teaching/classes/${encodeURIComponent(slug)}/learning-experience`;
	const [session, setSession] = useState<LearningExperienceSession | null>(null);
	const [studentSearch, setStudentSearch] = useState('');
	const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
	const [codeSearchResults, setCodeSearchResults] = useState<StudentLoginOption[]>([]);
	const [codeSearchPending, setCodeSearchPending] = useState(false);
	const [codeSearchError, setCodeSearchError] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [notice, setNotice] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [savingChoice, setSavingChoice] = useState<LearningExperienceChoice | null>(null);
	const [pendingChoice, setPendingChoice] = useState<LearningExperienceChoice | null>(null);
	const [pickerOpen, setPickerOpen] = useState(false);
	const pickerRef = useRef<HTMLDivElement>(null);
	const selectedStudent = useMemo(
		() => students.find((student) => student.enrollmentId === selectedEnrollmentId) ?? null,
		[selectedEnrollmentId, students],
	);
	const normalizedStudentSearch = normalizeSearch(studentSearch);
	const isCodeSearch = /^\d+$/.test(normalizedStudentSearch);
	const matchingStudents = useMemo(() => {
		if (isCodeSearch) return codeSearchResults;
		const query = normalizedStudentSearch;
		const matches = query
			? students.filter((student) =>
					normalizeSearch(`${student.studentCode} ${student.fullName}`).includes(query),
				)
			: students;
		return matches.slice(0, 8);
	}, [codeSearchResults, isCodeSearch, normalizedStudentSearch, students]);
	const studentsReady = useMemo(
		() => students.filter((student) => student.hasDateOfBirth).length,
		[students],
	);

	useEffect(() => {
		let active = true;
		teachingApi<LearningExperienceSession>(endpoint)
			.then((next) => {
				if (active) setSession(next);
			})
			.catch((reason: unknown) => {
				if (!active) return;
				setError(reason instanceof Error ? reason.message : 'Không tải được Learning Experience.');
				setSession({ authenticated: false });
			});
		return () => {
			active = false;
		};
	}, [endpoint]);

	useEffect(() => {
		if (!isCodeSearch) {
			setCodeSearchResults([]);
			setCodeSearchPending(false);
			setCodeSearchError('');
			return;
		}

		let active = true;
		const controller = new AbortController();
		setCodeSearchResults([]);
		setCodeSearchPending(true);
		setCodeSearchError('');
		const timer = window.setTimeout(() => {
			teachingApi<StudentLoginOption[]>(
				`${endpoint}/students?q=${encodeURIComponent(normalizedStudentSearch)}`,
				{ signal: controller.signal },
			)
				.then((results) => {
					if (active) setCodeSearchResults(results);
				})
				.catch((reason: unknown) => {
					if (!active || (reason instanceof DOMException && reason.name === 'AbortError')) return;
					setCodeSearchError('Không thể tìm MSV lúc này. Vui lòng thử lại.');
				})
				.finally(() => {
					if (active) setCodeSearchPending(false);
				});
		}, 200);

		return () => {
			active = false;
			controller.abort();
			window.clearTimeout(timer);
		};
	}, [endpoint, isCodeSearch, normalizedStudentSearch]);

	async function login(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!selectedStudent) {
			setError('Hãy chọn đúng một sinh viên từ danh sách lớp.');
			setPickerOpen(true);
			return;
		}
		if (!selectedStudent.hasDateOfBirth) {
			setError('Hồ sơ chưa có ngày sinh để xác thực. Vui lòng liên hệ giảng viên cập nhật roster.');
			return;
		}
		setSubmitting(true);
		setError('');
		setNotice('');
		try {
			const next = await teachingApi<LearningExperienceSession>(endpoint, {
				method: 'POST',
				body: JSON.stringify({ enrollmentId: selectedStudent.enrollmentId, password }),
			});
			setSession(next);
			setPassword('');
			setNotice(
				next.choice
					? 'Đã khôi phục lựa chọn trước đây của bạn.'
					: 'Xác thực thành công. Chọn trải nghiệm phù hợp với bạn.',
			);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Không thể xác thực.');
		} finally {
			setSubmitting(false);
		}
	}

	async function choose(choice: LearningExperienceChoice) {
		setSavingChoice(choice);
		setPendingChoice(null);
		setError('');
		setNotice('');
		try {
			const next = await teachingApi<LearningExperienceSession>(endpoint, {
				method: 'PUT',
				body: JSON.stringify({ choice }),
			});
			setSession(next);
			setNotice(
				choice === 'CHALLENGE'
					? 'Challenge accepted — lựa chọn của bạn đã được ghi nhận.'
					: 'Royal support unlocked — lựa chọn của bạn đã được ghi nhận.',
			);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Không thể lưu lựa chọn.');
		} finally {
			setSavingChoice(null);
		}
	}

	function requestChoice(choice: LearningExperienceChoice) {
		if (!session?.choice || session.choice === choice) {
			void choose(choice);
			return;
		}
		setPendingChoice(choice);
	}

	async function logout() {
		setError('');
		try {
			await teachingApi<{ loggedOut: boolean }>(endpoint, { method: 'DELETE' });
			setSession({ authenticated: false });
			setStudentSearch('');
			setSelectedEnrollmentId(null);
			setPassword('');
			setNotice('');
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Không thể đăng xuất.');
		}
	}

	function tilt(event: PointerEvent<HTMLElement>) {
		if (event.pointerType === 'touch') return;
		const rect = event.currentTarget.getBoundingClientRect();
		const x = (event.clientX - rect.left) / rect.width - 0.5;
		const y = (event.clientY - rect.top) / rect.height - 0.5;
		event.currentTarget.style.setProperty('--learning-rx', `${(-y * 3).toFixed(2)}deg`);
		event.currentTarget.style.setProperty('--learning-ry', `${(x * 3).toFixed(2)}deg`);
	}

	if (!session) {
		return (
			<div className={styles.loading} role="status">
				<span className={styles.loadingOrb} />
				<span>Đang mở Learning Experience…</span>
				<div className={styles.loadingSkeleton} aria-hidden="true">
					<span />
					<span />
					<span />
				</div>
			</div>
		);
	}

	if (!session.authenticated) {
		return (
			<section className={styles.authStage} aria-labelledby="learning-login-title">
				<div className={styles.authBackdrop} aria-hidden="true">
					<Image src={EXPERIENCE_IMAGES.CHALLENGE} alt="" fill loading="eager" sizes="50vw" />
					<Image src={EXPERIENCE_IMAGES.SUPPORT} alt="" fill loading="eager" sizes="50vw" />
				</div>
				<div className={styles.authScrim} />
				<div className={styles.authPanel}>
					<div className={styles.authCrest} aria-hidden="true">
						<span className="material-symbols-outlined">school</span>
					</div>
					<p className={styles.kicker}>HRM · Player access</p>
					<h2 id="learning-login-title">Mở trải nghiệm học tập của bạn</h2>
					<p className={styles.authCopy}>
						Xác nhận danh tính để đưa ra lựa chọn riêng của bạn trong lớp {courseName}.
					</p>
					<form className={styles.authForm} onSubmit={login}>
						<div
							ref={pickerRef}
							className={styles.authField}
							onBlur={(event) => {
								const nextTarget = event.relatedTarget as HTMLElement | null;
								if (!nextTarget || !event.currentTarget.contains(nextTarget)) setPickerOpen(false);
							}}
						>
							<label htmlFor="learning-student-code">
								<span>Chọn sinh viên trong lớp</span>
							</label>
							<div className={`${styles.inputShell} ${styles.studentPicker}`}>
								<span className="material-symbols-outlined" aria-hidden="true">
									search
								</span>
								<input
									id="learning-student-code"
									value={studentSearch}
									onChange={(event) => {
										setStudentSearch(event.target.value.toUpperCase());
										setSelectedEnrollmentId(null);
										setPassword('');
										setError('');
										setPickerOpen(true);
									}}
									onFocus={() => setPickerOpen(true)}
									onKeyDown={(event) => {
										if (event.key === 'Escape') setPickerOpen(false);
									}}
									autoComplete="username"
									autoCapitalize="characters"
									placeholder="Tìm tên hoặc 2 số cuối MSV"
									role="combobox"
									aria-autocomplete="list"
									aria-expanded={pickerOpen}
									aria-controls="learning-student-options"
									required
								/>
								<span className={styles.pickerChevron} aria-hidden="true">
									⌄
								</span>
							</div>
							{pickerOpen ? (
								<div
									id="learning-student-options"
									className={styles.studentOptions}
									role="listbox"
									aria-label="Sinh viên trong lớp"
								>
									{matchingStudents.map((student) => (
										<button
											type="button"
											role="option"
											aria-selected={selectedStudent?.enrollmentId === student.enrollmentId}
											key={student.enrollmentId}
											data-ready={student.hasDateOfBirth}
											onClick={() => {
												setStudentSearch(student.studentCode);
												setSelectedEnrollmentId(student.enrollmentId);
												setPassword('');
												setError('');
												setPickerOpen(false);
											}}
										>
											<span>
												<strong>{student.studentCode}</strong>
												<small>{student.fullName}</small>
											</span>
											<em>{student.hasDateOfBirth ? 'Sẵn sàng' : 'Thiếu ngày sinh'}</em>
										</button>
									))}
									{codeSearchPending ? <p>Đang tìm MSV…</p> : null}
									{codeSearchError ? <p>{codeSearchError}</p> : null}
									{!codeSearchPending && !codeSearchError && matchingStudents.length === 0 ? (
										<p>Không tìm thấy sinh viên phù hợp trong lớp.</p>
									) : null}
								</div>
							) : null}
							{selectedStudent ? (
								<div className={styles.selectedStudent} data-ready={selectedStudent.hasDateOfBirth}>
									<span className="material-symbols-outlined" aria-hidden="true">
										{selectedStudent.hasDateOfBirth ? 'check_circle' : 'warning'}
									</span>
									<p>
										<strong>{selectedStudent.fullName}</strong>
										<small>{selectedStudent.studentCode}</small>
									</p>
									<em>
										{selectedStudent.hasDateOfBirth
											? 'Có thể xác thực'
											: 'Roster chưa có ngày sinh'}
									</em>
								</div>
							) : (
								<small>
									{students.length} sinh viên · {studentsReady} hồ sơ đã có ngày sinh
								</small>
							)}
						</div>
						<div className={styles.authField}>
							<label htmlFor="learning-student-password">
								<span>Mật khẩu ngày sinh</span>
							</label>
							<div className={styles.inputShell}>
								<span className="material-symbols-outlined" aria-hidden="true">
									key
								</span>
								<input
									id="learning-student-password"
									value={password}
									onChange={(event) =>
										setPassword(event.target.value.replace(/\D/g, '').slice(0, 8))
									}
									type="password"
									inputMode="numeric"
									autoComplete="current-password"
									pattern="[0-9]{8}"
									maxLength={8}
									placeholder={selectedStudent?.hasDateOfBirth ? 'ddmmyyyy' : 'Cần cập nhật ngày sinh'}
									disabled={!selectedStudent?.hasDateOfBirth}
									required
								/>
							</div>
							<small>
								{selectedStudent?.hasDateOfBirth
									? '8 chữ số, ví dụ 05/09/2006 → 05092006'
									: 'Hồ sơ thiếu ngày sinh nên chưa thể xác thực. Vui lòng liên hệ giảng viên.'}
							</small>
						</div>
						{error ? (
							<p className={styles.error} role="alert">
								{error}
							</p>
						) : null}
						<button
							type="submit"
							className={styles.enterButton}
								disabled={
									submitting ||
									!selectedStudent ||
									!selectedStudent.hasDateOfBirth ||
									password.length !== 8
								}
							>
								{submitting ? 'Đang mở…' : 'Enter experience'}
							<span className="material-symbols-outlined" aria-hidden="true">
								arrow_forward
							</span>
						</button>
					</form>
					<p className={styles.securityNote}>
						<span className="material-symbols-outlined" aria-hidden="true">
							verified_user
						</span>
						Ngày sinh chỉ được kiểm tra trên server và không hiển thị công khai.
					</p>
				</div>
			</section>
		);
	}

	return (
		<section className={styles.experience} aria-labelledby="learning-experience-title">
			<div className={styles.sparkles} aria-hidden="true" />
			<div className={styles.playerBar}>
				<div>
					<span className={styles.playerLabel}>Player verified</span>
					<strong>{session.student?.fullName}</strong>
					<span>{session.student?.studentCode}</span>
				</div>
				<button type="button" onClick={() => void logout()}>
					Đổi sinh viên
				</button>
			</div>

			<header className={styles.heroHeader}>
				<p className={styles.kicker}>Learning experience · {courseName}</p>
				<h2 id="learning-experience-title">Choose your HRM learning style</h2>
				<div className={styles.titleRule}>
					<span />
					<p>Different styles. Same goal. Your growth.</p>
					<span />
				</div>
			</header>

			<div className={styles.choiceGrid}>
				<div className={styles.orBadge} aria-hidden="true">
					OR
				</div>
				{experiences.map((item, index) => {
					const selected = session.choice === item.choice;
					const dimmed = Boolean(session.choice) && !selected;
					const locked = Boolean(session.locked);
					const buttonLabel =
						savingChoice === item.choice
							? 'Đang lưu…'
							: selected
								? 'Đã chọn'
								: locked
									? 'Đã khóa'
									: session.choice
										? 'Đổi sang lựa chọn này · còn 1 lần'
										: item.action;
					return (
						<article
							key={item.choice}
							className={styles.choiceCard}
							data-tone={item.choice === 'CHALLENGE' ? 'challenge' : 'support'}
							data-selected={selected}
							data-dimmed={dimmed}
							onPointerMove={dimmed ? undefined : tilt}
							onPointerLeave={dimmed ? undefined : (event) => resetTilt(event.currentTarget)}
						>
							<div className={styles.cardVisual}>
								<Image
									src={EXPERIENCE_IMAGES[item.choice]}
									alt=""
									fill
									loading="eager"
									fetchPriority={index === 0 ? 'high' : 'auto'}
									sizes="(max-width: 767px) 100vw, 50vw"
									className={styles.cardImage}
									style={{ objectPosition: index === 0 ? '50% 28%' : '50% center' }}
								/>
								<div className={styles.imageShade} />
								<span className={styles.modePill}>{item.mode}</span>
								{selected ? (
									<span className={styles.selectedBadge}>
										<span className="material-symbols-outlined" aria-hidden="true">
											workspace_premium
										</span>
										Lựa chọn của bạn
									</span>
								) : null}
							</div>
							<div className={styles.cardBody}>
								<h3>
									<span>{index + 1}.</span> {item.title}
								</h3>
								<p className={styles.cardSubtitle}>{item.subtitle}</p>
								<div className={styles.featureGrid}>
									{item.features.map((feature) => (
										<div key={feature.label}>
											<span className="material-symbols-outlined" aria-hidden="true">
												{feature.icon}
											</span>
											<span>{feature.label}</span>
										</div>
									))}
								</div>
								<button
									type="button"
									className={styles.choiceButton}
									disabled={savingChoice !== null || selected || (dimmed && locked)}
									onClick={() => requestChoice(item.choice)}
								>
									{buttonLabel}
									<span className="material-symbols-outlined" aria-hidden="true">
										{selected ? 'check_circle' : locked ? 'lock' : 'arrow_forward'}
									</span>
								</button>
							</div>
						</article>
					);
				})}
			</div>

			<div className={styles.statusBar} aria-live="polite" data-error={Boolean(error)}>
				<span className="material-symbols-outlined" aria-hidden="true">
					{error ? 'error' : session.locked ? 'lock' : session.choice ? 'auto_awesome' : 'explore'}
				</span>
				<p>
					{error ||
						notice ||
						(session.locked
							? 'Lựa chọn đã khóa. Cần đổi? Nhắn giảng viên để được hỗ trợ.'
							: session.choice
								? 'Bạn còn 1 lần đổi duy nhất.'
								: 'Chọn một con đường để bắt đầu hành trình.')}
				</p>
			</div>

			<Dialog
				open={pendingChoice !== null}
				onClose={() => setPendingChoice(null)}
				title="Đổi lựa chọn lần cuối?"
				description="Đây là lần đổi cuối cùng của bạn. Sau khi xác nhận, lựa chọn sẽ bị khóa."
			>
				<div className="space-y-4">
					<p className="text-sm text-ink-secondary">
						{pendingChoice === 'CHALLENGE'
							? 'Bạn sẽ chuyển sang Challenge mode — Teach me a lesson.'
							: 'Bạn sẽ chuyển sang Royal support mode — Prince / Princess treatment.'}
					</p>
					<div className="flex justify-end gap-2">
						<button
							type="button"
							className="mc-button mc-button-ghost"
							onClick={() => setPendingChoice(null)}
						>
							Hủy
						</button>
						<button
							type="button"
							className="mc-button mc-button-primary"
							disabled={savingChoice !== null}
							onClick={() => pendingChoice && void choose(pendingChoice)}
						>
							Xác nhận đổi
						</button>
					</div>
				</div>
			</Dialog>
		</section>
	);
}
