import type { WatchStatus } from './evaluation';

export const NOTIFICATION_CATEGORIES = [
	'deviceWarning',
	'deviceAlarm',
	'deviceTimeout',
	'invalidSource',
	'deviceRecovered',
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

/**
 * Maps a real status transition to its notification category.
 *
 * @param previous Status before the update.
 * @param current Status after the update.
 * @returns Category to emit, or undefined when the transition is not noteworthy.
 */
export function notificationCategoryForTransition(
	previous: WatchStatus,
	current: WatchStatus,
): NotificationCategory | undefined {
	if (previous === current) {
		return undefined;
	}
	if (current === 'warning') {
		return 'deviceWarning';
	}
	if (current === 'alarm') {
		return 'deviceAlarm';
	}
	if (current === 'timeout') {
		return 'deviceTimeout';
	}
	if (current === 'invalid') {
		return 'invalidSource';
	}
	if (current === 'ok' && ['warning', 'alarm', 'timeout', 'invalid'].includes(previous)) {
		return 'deviceRecovered';
	}
	return undefined;
}
