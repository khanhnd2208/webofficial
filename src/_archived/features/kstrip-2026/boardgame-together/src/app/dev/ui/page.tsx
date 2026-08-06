'use client';

import DarkModeToggle from '@/components/theme/DarkModeToggle';
import {
	Badge,
	Button,
	Card,
	Checkbox,
	Dossier,
	EmptyState,
	ErrorState,
	Field,
	Input,
	Panel,
	Select,
	Skeleton,
	Spinner,
	Stamp,
	TicketCard,
} from '@/components/ui';

export default function UiLabPage() {
	return (
		<div className="min-h-screen bg-background px-4 py-10">
			<div className="mx-auto max-w-3xl space-y-12">
				<header className="flex items-center justify-between">
					<div>
						<h1 className="font-display text-3xl font-bold text-ink">UI Lab</h1>
						<p className="text-sm text-muted-foreground">Covert Expedition design system</p>
					</div>
					<DarkModeToggle />
				</header>

				<Panel title="Buttons" description="All variants and states">
					<div className="flex flex-wrap gap-3">
						<Button variant="primary">Primary</Button>
						<Button variant="secondary">Secondary</Button>
						<Button variant="tertiary">Tertiary</Button>
						<Button variant="destructive">Destructive</Button>
						<Button variant="ghost">Ghost</Button>
						<Button variant="success">Success</Button>
						<Button loading>Loading</Button>
						<Button disabled>Disabled</Button>
					</div>
				</Panel>

				<Panel title="Form">
					<Field label="Tên đặc vụ" htmlFor="lab-name" hint="Tối đa 24 ký tự">
						<Input id="lab-name" placeholder="Nhập tên" />
					</Field>
					<Field label="Chủ đề" className="mt-4">
						<Select>
							<option>Bất kỳ</option>
							<option>Ẩm thực</option>
						</Select>
					</Field>
					<Checkbox label="Phòng công khai" className="mt-4" />
				</Panel>

				<Panel title="Badges & Stamps">
					<div className="flex flex-wrap gap-2">
						<Badge>Default</Badge>
						<Badge variant="accent">Chơi ngay</Badge>
						<Badge variant="success">Sẵn sàng</Badge>
						<Stamp label="Classified" variant="classified" animate />
						<Stamp label="Suspect" variant="suspect" />
					</div>
				</Panel>

				<Panel title="TicketCard">
					<TicketCard title="Phòng của tôi" code="ABC123" subtitle="4–12 đặc vụ" />
				</Panel>

				<Panel title="Dossier">
					<Dossier revealed={false} onRevealStart={() => {}} onRevealEnd={() => {}}>
						<p className="font-display text-2xl font-bold">Officer</p>
						<p className="mt-2 text-3xl font-bold">Bãi biển</p>
					</Dossier>
				</Panel>

				<Panel title="States">
					<div className="space-y-4">
						<EmptyState
							icon="🕵️"
							title="Chưa có phòng"
							description="Tạo phòng mới và mời đồng đội qua mã hoặc QR."
							actionLabel="Tạo phòng"
							onAction={() => {}}
						/>
						<ErrorState message="Không kết nối được. Kiểm tra mạng và thử lại." onRetry={() => {}} />
						<div className="flex gap-3">
							<Skeleton className="h-12 w-full" />
							<Spinner />
						</div>
					</div>
				</Panel>

				<Panel title="Card">
					<Card elevated>
						<p className="text-sm text-muted-foreground">Surface elevated card</p>
					</Card>
				</Panel>
			</div>
		</div>
	);
}
