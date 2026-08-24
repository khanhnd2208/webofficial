import type { HTMLAttributes } from 'react';

export type McIconName =
	| 'add'
	| 'arrow_back'
	| 'arrow_drop_down'
	| 'arrow_forward'
	| 'assignment'
	| 'bar_chart'
	| 'block'
	| 'book'
	| 'campaign'
	| 'check'
	| 'chevron_left'
	| 'chevron_right'
	| 'close'
	| 'content_copy'
	| 'dashboard'
	| 'delete'
	| 'download'
	| 'drag_indicator'
	| 'edit'
	| 'error'
	| 'event_available'
	| 'event_repeat'
	| 'expand_more'
	| 'filter_list'
	| 'groups'
	| 'help'
	| 'home'
	| 'info'
	| 'library_books'
	| 'lock'
	| 'menu'
	| 'menu_book'
	| 'more_vert'
	| 'open_in_new'
	| 'percent'
	| 'play_arrow'
	| 'quiz'
	| 'remove'
	| 'save'
	| 'schedule'
	| 'school'
	| 'search'
	| 'upload'
	| 'unfold_less'
	| 'unfold_more'
	| 'view_column'
	| 'visibility'
	| 'warning';

type McIconProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
	name: McIconName | (string & {});
	size?: number;
	filled?: boolean;
};

export function McIcon({
	name,
	size = 24,
	filled = false,
	className = '',
	'aria-hidden': ariaHidden = true,
	style,
	...props
}: McIconProps) {
	return (
		<span
			className={`material-symbols-outlined ${className}`}
			aria-hidden={ariaHidden}
			style={{
				fontSize: size,
				fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
				...style,
			}}
			{...props}
		>
			{name}
		</span>
	);
}
