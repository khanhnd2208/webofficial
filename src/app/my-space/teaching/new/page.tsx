import { NewTeachingClassWorkspace } from '@/components/teaching/admin/NewTeachingClassWorkspace';

export const dynamic = 'force-dynamic';

export default function MySpaceNewTeachingClassPage() {
	return (
		<div className="py-6 sm:py-8">
			<NewTeachingClassWorkspace />
		</div>
	);
}
