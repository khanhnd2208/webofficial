'use client';

import { TeachingIcon } from '../ui/TeachingIcon';
import Image from 'next/image';
import {
	useEffect,
	useMemo,
	useRef,
	useState,
	type FormEvent,
	type KeyboardEvent,
	type PointerEvent,
} from 'react';

import { McIcon, type McIconName } from '@/components/myclass/ui';
import { teachingApi } from '@/components/teaching/admin/api';
import { useTeachingDismissible } from '@/components/teaching/TeachingPopover';
import { Dialog } from '@/components/ui/Dialog';
import type {
	LearningExperienceChoice,
	LearningExperienceSession,
	LearningExperienceStudentOption,
} from '@/features/teaching/types';

import accessStyles from './LearningExperienceWorkspace.module.css';
import choiceStyles from './LearningExperienceChoices.module.css';
const styles = { ...accessStyles, ...choiceStyles };

const EXPERIENCE_IMAGES = {
	CHALLENGE: '/brand/teaching/teach-you-a-lesson.png',
	SUPPORT: '/brand/teaching/prince-princess-treatment.png',
} satisfies Record<LearningExperienceChoice, string>;

function normalizeSearch(value: string) {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.trim();
}

function studentMatchesQuery(student: LearningExperienceStudentOption, query: string) {
	if (!query) return true;
	if (/^\d+$/.test(query)) return student.studentCode.endsWith(query.slice(-2));
	return normalizeSearch(`${student.studentCode} ${student.fullName}`).includes(query);
}

const experiences: Array<{
	choice: LearningExperienceChoice;
	mode: string;
	title: string;
	subtitle: string;
	action: string;
	features: Array<{ icon: McIconName; label: string }>;
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
	students: LearningExperienceStudentOption[];
}) {
	const endpoint = `/api/teaching/classes/${encodeURIComponent(slug)}/learning-experience`;
	const [session, setSession] = useState<LearningExperienceSession | null>(null);
	const [studentSearch, setStudentSearch] = useState('');
	const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState('');
	const [notice, setNotice] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [savingChoice, setSavingChoice] = useState<LearningExperienceChoice | null>(null);
	const [pendingChoice, setPendingChoice] = useState<LearningExperienceChoice | null>(null);
	const [pickerOpen, setPickerOpen] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const pickerRef = useRef<HTMLDivElement>(null);
	const passwordRef = useRef<HTMLInputElement>(null);
	useTeachingDismissible({
		open: pickerOpen,
		onClose: () => setPickerOpen(false),
		rootRef: pickerRef,
	});
	const selectedStudent = useMemo(
		() => students.find((student) => student.enrollmentId === selectedEnrollmentId) ?? null,
		[selectedEnrollmentId, students],
	);
	const normalizedStudentSearch = normalizeSearch(studentSearch);
	const matchingStudents = useMemo(() => {
		return students
			.filter((student) => studentMatchesQuery(student, normalizedStudentSearch))
			.slice(0, 8);
	}, [normalizedStudentSearch, students]);
	const studentsReady = useMemo(
		() => students.filter((student) => student.accessMode === 'DOB_PASSWORD').length,
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
		setHighlightedIndex(-1);
	}, [normalizedStudentSearch]);

	function selectStudent(student: LearningExperienceStudentOption) {
		setStudentSearch(student.studentCode);
		setSelectedEnrollmentId(student.enrollmentId);
		setPassword('');
		setShowPassword(false);
		setError('');
		setPickerOpen(false);
		if (student.accessMode === 'DOB_PASSWORD') {
			window.setTimeout(() => passwordRef.current?.focus(), 0);
		}
	}

	function handleStudentKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key === 'Escape') {
			setPickerOpen(false);
			return;
		}
		if (!pickerOpen || matchingStudents.length === 0) return;
		if (event.key === 'Home' || event.key === 'End') {
			event.preventDefault();
			setHighlightedIndex(event.key === 'Home' ? 0 : matchingStudents.length - 1);
			return;
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			setHighlightedIndex((current) => Math.min(current + 1, matchingStudents.length - 1));
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			setHighlightedIndex((current) => (current <= 0 ? matchingStudents.length - 1 : current - 1));
		} else if (event.key === 'Enter') {
			event.preventDefault();
			selectStudent(matchingStudents[highlightedIndex] ?? matchingStudents[0]!);
		}
	}

	async function login(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!selectedStudent) {
			setError('Hãy chọn đúng một sinh viên từ danh sách lớp.');
			setPickerOpen(true);
			return;
		}
		setSubmitting(true);
		setError('');
		setNotice('');
		try {
			const next = await teachingApi<LearningExperienceSession>(endpoint, {
				method: 'POST',
				body: JSON.stringify({
					enrollmentId: selectedStudent.enrollmentId,
					...(selectedStudent.accessMode === 'DOB_PASSWORD' ? { password } : {}),
				}),
			});
			setSession(next);
			setPassword('');
			setNotice(
				next.choice
					? 'Đã khôi phục lựa chọn trước đây của bạn.'
					: 'Đã mở quyền truy cập. Chọn trải nghiệm phù hợp với bạn.',
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
		if (session?.locked && session.choice && session.choice !== choice) return;
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
		if (
			event.pointerType === 'touch' ||
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		)
			return;
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
				<div className={styles.authPanel}>
					<div className={styles.authCrest} aria-hidden="true">
						<TeachingIcon name="teaching" size={32} />
					</div>
					<p className={styles.kicker}>{courseName} · Player access</p>
					<h2 id="learning-login-title">Mở trải nghiệm học tập của bạn</h2>
					<p className={styles.authCopy}>
						Chọn hồ sơ sinh viên để mở lựa chọn riêng của bạn trong lớp {courseName}.
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
								<McIcon name="search" size={20} />
								<input
									id="learning-student-code"
									value={studentSearch}
									onChange={(event) => {
										setStudentSearch(event.target.value.toUpperCase());
										setSelectedEnrollmentId(null);
										setPassword('');
										setShowPassword(false);
										setHighlightedIndex(-1);
										setError('');
										setPickerOpen(true);
									}}
									onFocus={() => setPickerOpen(true)}
									onKeyDown={handleStudentKeyDown}
									autoComplete="off"
									autoCapitalize="characters"
									placeholder="Tìm tên hoặc 2 số cuối MSV"
									role="combobox"
									aria-autocomplete="list"
									aria-expanded={pickerOpen}
									aria-controls="learning-student-options"
									aria-activedescendant={
										highlightedIndex >= 0
											? `learning-student-option-${matchingStudents[highlightedIndex]?.enrollmentId}`
											: undefined
									}
									required
								/>
								<McIcon name="expand_more" size={18} className={styles.pickerChevron} />
							</div>
							{pickerOpen ? (
								<div
									id="learning-student-options"
									className={styles.studentOptions}
									role="listbox"
									aria-label="Sinh viên trong lớp"
								>
									{matchingStudents.map((student, index) => (
										<button
											type="button"
											role="option"
											aria-selected={selectedStudent?.enrollmentId === student.enrollmentId}
											key={student.enrollmentId}
											id={`learning-student-option-${student.enrollmentId}`}
											data-access={student.accessMode}
											data-highlighted={highlightedIndex === index}
											onPointerDown={(event) => {
												if (event.pointerType !== 'mouse') {
													event.preventDefault();
													selectStudent(student);
												}
											}}
											onClick={() => selectStudent(student)}
										>
											<span>
												<strong>{student.studentCode}</strong>
												<small>{student.fullName}</small>
											</span>
											<em>
												{student.accessMode === 'DOB_PASSWORD'
													? 'Cần mật khẩu ngày sinh'
													: 'Vào không cần mật khẩu'}
											</em>
										</button>
									))}
									{matchingStudents.length === 0 ? (
										<p>Không tìm thấy sinh viên phù hợp trong lớp.</p>
									) : null}
								</div>
							) : null}
							{selectedStudent ? (
								<div className={styles.selectedStudent} data-access={selectedStudent.accessMode}>
									<McIcon
										name={selectedStudent.accessMode === 'DOB_PASSWORD' ? 'key' : 'login'}
										size={18}
									/>
									<p>
										<strong>{selectedStudent.fullName}</strong>
										<small>{selectedStudent.studentCode}</small>
									</p>
									<em>
										{selectedStudent.accessMode === 'DOB_PASSWORD'
											? 'Nhập mật khẩu ngày sinh'
											: 'Có thể vào ngay'}
									</em>
								</div>
							) : (
								<small>
									{students.length} sinh viên · {studentsReady} hồ sơ cần mật khẩu ngày sinh
								</small>
							)}
						</div>
						{selectedStudent?.accessMode === 'DOB_PASSWORD' ? (
							<div className={styles.authField}>
								<label htmlFor="learning-student-password">
									<span>Mật khẩu ngày sinh</span>
								</label>
								<div className={styles.inputShell}>
									<McIcon name="key" size={20} />
									<input
										ref={passwordRef}
										id="learning-student-password"
										value={password}
										onChange={(event) =>
											setPassword(event.target.value.replace(/\D/g, '').slice(0, 8))
										}
										type={showPassword ? 'text' : 'password'}
										inputMode="numeric"
										autoComplete="off"
										pattern="[0-9]{8}"
										maxLength={8}
										placeholder="ddmmyyyy"
										required
									/>
									<button
										type="button"
										className={styles.passwordToggle}
										aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
										onClick={() => setShowPassword((visible) => !visible)}
									>
										<McIcon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
									</button>
								</div>
								<small>8 chữ số, ví dụ 05/09/2006 → 05092006</small>
							</div>
						) : (
							<div className={styles.accessHint}>
								<McIcon name="login" size={16} />
								<p>
									{selectedStudent
										? 'Hồ sơ này không yêu cầu mật khẩu. Bạn có thể vào Learning Experience ngay.'
										: 'Sau khi chọn sinh viên, hệ thống sẽ cho biết có cần mật khẩu hay không.'}
								</p>
							</div>
						)}
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
								(selectedStudent.accessMode === 'DOB_PASSWORD' && password.length !== 8)
							}
						>
							{submitting
								? 'Đang mở…'
								: selectedStudent?.accessMode === 'OPEN'
									? 'Vào trải nghiệm'
									: 'Enter experience'}
							<McIcon name="arrow_forward" size={18} />
						</button>
					</form>
					<p className={styles.securityNote}>
						<McIcon name="verified_user" size={16} />
						Ngày sinh chỉ được kiểm tra trên server và không hiển thị công khai.
					</p>
				</div>
			</section>
		);
	}

	return (
		<section className={styles.experience} aria-labelledby="learning-experience-title">
			<div className={styles.playerBar}>
				<div>
					<span className={styles.playerLabel}>Learning Experience access</span>
					<strong>{session.student?.fullName}</strong>
					<span>{session.student?.studentCode}</span>
				</div>
				<button type="button" onClick={() => void logout()}>
					Đổi sinh viên
				</button>
			</div>

			<header className={styles.heroHeader}>
				<p className={styles.kicker}>Learning experience · {courseName}</p>
				<h2 id="learning-experience-title">Choose your learning style</h2>
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
										? 'Đổi sang lựa chọn này'
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
										<McIcon name="workspace_premium" size={16} />
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
											<McIcon name={feature.icon} size={22} />
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
									<McIcon
										name={selected ? 'check_circle' : locked ? 'lock' : 'arrow_forward'}
										size={18}
									/>
								</button>
							</div>
						</article>
					);
				})}
			</div>

			<div className={styles.statusBar} aria-live="polite" data-error={Boolean(error)}>
				<McIcon
					name={
						error ? 'error' : session.locked ? 'lock' : session.choice ? 'auto_awesome' : 'explore'
					}
					size={18}
				/>
				<p>
					{error ||
						notice ||
						(session.locked
							? 'Lựa chọn đã khóa. Không thể chọn lại. Nếu cần hỗ trợ, hãy nhắn giảng viên.'
							: session.choice
								? 'Lựa chọn đã được ghi nhận.'
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
