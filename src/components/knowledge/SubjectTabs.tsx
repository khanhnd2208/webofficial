import Link from 'next/link';
import { routes } from '@/config/routes';

export default function SubjectTabs({ courseSlug, active, hasVocabulary = false }: { courseSlug: string; active: 'content' | 'review' | 'vocab'; hasVocabulary?: boolean }) {
	return <nav className="mc-subject-tabs" aria-label="Điều hướng môn học">
		<Link className={active === 'content' ? 'is-active' : ''} aria-current={active === 'content' ? 'page' : undefined} href={routes.myClassCourse(courseSlug)}>Nội dung</Link>
		<Link className={active === 'review' ? 'is-active' : ''} aria-current={active === 'review' ? 'page' : undefined} href={routes.myClassReview(courseSlug)}>Ôn tập</Link>
		{hasVocabulary ? <Link className={active === 'vocab' ? 'is-active' : ''} aria-current={active === 'vocab' ? 'page' : undefined} href={routes.myClassVocabIndex(courseSlug)}>Từ vựng</Link> : null}
	</nav>;
}
