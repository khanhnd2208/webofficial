/** Matches resolveEmailDelivery: a dedicated failed flag, or a legacy emailStatus when the new field is absent. */
export function failedNotificationFilter(): Record<string, unknown> {
	return {
		$or: [{ adminEmailStatus: 'failed' }, { adminEmailStatus: null, emailStatus: 'failed' }],
	};
}
